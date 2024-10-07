import { MINUTE } from "#constants/globals/time.js";
import { ReactionInteraction } from "#lib/Discord_utils.js";
import { createStopPromise } from "#lib/createStopPromise.js";
import EventsEmitter from "events";

function processUserCanUseInteraction(interaction, messageInterface) {
  const { options } = messageInterface;
  if (!options.user) {
    return true;
  }
  if (interaction.user.id === options.user.id) {
    return true;
  }
  interaction.msg({
    ephemeral: true,
    description: `Это взаимодействие доступно только ${options.user.username}`,
    delete: 7_000,
  });
  return false;
}

class AbstractHideDisabledComponents {
  static needHide(messageInterface, component) {
    return messageInterface.options.hideDisabledComponents
      ? !component.disabled
      : true;
  }
}

export class MessageInterface_Options {
  components = [];
  hideDisabledComponents = null;
  reactions = [];
  render = null;
  time = MINUTE * 5;
  user = null;
}
export class MessageInterface {
  static CollectType = {
    component: "component",
    reaction: "reaction",
  };
  static Events = {
    before_close: "before_close",
    before_collect: "before_collect",
    collect: "collect",
    allowed_collect: "allowed_collect",
    disallowed_collect: "disallowed_collect",
    before_update: "before_update",
  };
  _closed = false;
  _collectors = [];
  channel = null;
  embed = {};
  emitter = new EventsEmitter();

  message = null;

  options = new MessageInterface_Options();

  constructor(channel) {
    this.setChannel(channel);
  }

  async _beforeCollect(type, interaction) {
    const event = {
      type,
      interaction,
      force_allow() {
        this.allowed_force = true;
      },
      ...createStopPromise(),
    };
    this.emitter.emit(MessageInterface.Events.before_collect, event);
    await event.whenStopPromises();

    this._onCollect(type, interaction, { force_allow: event.allowed_force });
  }

  _clean(target = null) {
    this.options.components.empty();
    this.options.reactions.empty();
    this.updateMessage(target);
  }

  _clean_missing_reactions(target) {
    if ("reactions" in target === false) {
      return;
    }
    const { options } = this;
    target.reactions.cache
      .filter((reaction) => !options.reactions.includes(reaction.emoji.code))
      .every((reaction) => reaction.remove());
  }

  _createCollectors() {
    this._collectors.push(this._createComponentCollector());
    this._collectors.push(this._createReactionCollector());
  }

  _createComponentCollector() {
    const collector = this.message.createMessageComponentCollector({
      time: this.options.time,
    });
    collector.on("collect", (interaction) =>
      this._onCollect.call(
        this,
        MessageInterface.CollectType.component,
        interaction,
      ),
    );
    collector.once("end", () => this.close());
    return collector;
  }

  async _createMessage(target) {
    target ||= this.channel;
    this.message = await this._renderPage(target, {
      ...(await this._getMessageOptions()),
    });
    this._createCollectors();
    return this.message;
  }

  _createReactionCollector() {
    const collector = this.message.createReactionCollector({
      time: this.options.time,
    });
    const { client } = this.message;
    collector.on(
      "collect",
      (reaction, user) =>
        user !== client.user &&
        this._onCollect.call(
          this,
          MessageInterface.CollectType.reaction,
          new ReactionInteraction(reaction, user),
        ),
    );
    collector.once("end", () => this.close());
    return collector;
  }

  async _editMessage(target) {
    target ||= this.message;
    this._clean_missing_reactions(target);
    return await this._renderPage(target, {
      ...(await this._getMessageOptions()),
      edit: true,
    });
  }

  async _getMessageOptions() {
    const { options } = this;
    return {
      components: options.components.filter(
        AbstractHideDisabledComponents.needHide.bind(null, this),
      ),
      reactions: this.options.reactions,
      ...this.embed,
      ...((await this.options.render?.()) || {}),
    };
  }

  _onCollect(type, interaction, { force_allow = false } = {}) {
    const data = this._onCollect_processData(type, interaction, {
      force_allow,
    });
    this._onCollect_emit(data);
  }

  _onCollect_emit(data) {
    this.emitter.emit(MessageInterface.Events.collect, data);
    const _targetEvent = data.isAllowed
      ? "allowed_collect"
      : "disallowed_collect";

    this.emitter.emit(MessageInterface.Events[_targetEvent], data);
  }

  _onCollect_processData(type, interaction, { force_allow = false } = {}) {
    const data = {
      type,
      interaction,
      isAllowed: force_allow || processUserCanUseInteraction(interaction, this),
    };
    return data;
  }

  _recreateMessage(target, force = false) {
    if (this._closed && !force) {
      throw new Error("MessageInterface is closed");
    }
    this._closed = false;
    for (const collector of this._collectors) {
      collector.ended = true;
    }
    this._collectors.empty();
    this._createMessage(target);
  }

  async _renderPage(target, value) {
    const event = {
      target,
      me: this,
      ...createStopPromise(),
      value,
    };
    this.emitter.emit(MessageInterface.Events.before_update, event);
    await event.whenStopPromises();
    return target.msg(value);
  }

  _setOptions(data) {
    Object.assign(this.options, data);
  }

  close() {
    if (this._closed) {
      return;
    }
    this.emitter.emit(MessageInterface.Events.before_close);
    this.emitter.removeAllListeners();
    for (const collector of this._collectors) {
      collector.stop();
    }
    this._closed = true;
    this._clean();
  }

  setChannel(channel) {
    this.channel = channel;
  }

  setComponents(components) {
    this._setOptions({ components });
  }

  setDefaultMessageState(addable) {
    Object.assign(this.embed, addable);
  }

  setHideDisabledComponents(value) {
    this._setOptions({ hideDisabledComponents: value });
  }

  setReactions(reactions) {
    this._setOptions({ reactions });
  }

  setRender(callback) {
    this._setOptions({ render: callback });
  }

  setUser(user) {
    this._setOptions({ user });
  }

  async updateMessage(target = null) {
    try {
      return await (this.message
        ? this._editMessage(target)
        : this._createMessage(target));
    } catch (error) {
      if (error.message.includes("Unknown Message")) {
        return await this._recreateMessage(target);
      }
      throw error;
    }
  }
}
