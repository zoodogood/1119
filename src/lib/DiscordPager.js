import { question } from "#bot/util.js";
import { Emoji } from "#constants/emojis.js";
import { MINUTE } from "#constants/globals/time.js";
import { createStopPromise } from "#lib/createStopPromise.js";
import { justButtonComponents } from "@zoodogood/utils/discordjs";
import { ending } from "@zoodogood/utils/primitives";
import EventsEmitter from "events";

function processUserCanUseInteraction(interaction, pager) {
  if (!pager.user) {
    return true;
  }
  if (interaction.user.id !== pager.user.id) {
    return false;
  }
  return true;
}

class DefaultComponentsProcessor {
  callbacks;
  constructor(pager) {
    this.pager = pager;
    this._initCallbacks();
  }

  process() {
    const { DefaultComponents } = this.pager.constructor;
    const components = Object.values(structuredClone(DefaultComponents));
    this.processIsDisabledGetters(components);
    this.pager.components.push(...components);
  }

  _initCallbacks() {
    const { NEXT, PREVIOUS, SELECT } = this.pager.constructor.DefaultComponents;
    this.callbacks = {
      [PREVIOUS.customId]: (component) => {
        Object.defineProperty(component, "disabled", {
          get: () => this.pager.currentPage === 0,
          enumerable: true,
        });
      },
      [NEXT.customId]: (component) => {
        Object.defineProperty(component, "disabled", {
          get: () =>
            this.pager.pages.length &&
            this.pager.currentPage === this.pager.pages.length - 1,
          enumerable: true,
        });
      },
      [SELECT.customId]: (component) => {
        Object.defineProperty(component, "disabled", {
          get: () => this.pager.pages.length <= 1,
          enumerable: true,
        });

        Object.defineProperty(component, "label", {
          get: () => `Страница #${this.pager.currentPage + 1}`,
          enumerable: true,
        });
      },
    };
  }

  processIsDisabledGetters(components) {
    for (const component of components) {
      this.callbacks[component.customId]?.(component);
    }
  }
}

export class Pager extends EventsEmitter {
  message = null;
  channel = null;
  components = [];
  pages = [];
  embed = {};
  currentPage = 0;
  user = null;

  constructor(channel) {
    super();
    this.setChannel(channel);
    this._processDefaultComponents();
  }

  setChannel(channel) {
    this.channel = channel;
  }

  setUser(user) {
    this.user = user;
  }

  setDefaultMessageState(addable) {
    Object.assign(this.embed, addable);
  }

  addPages(...pages) {
    this.pages.push(...pages);
  }

  setPageAt(index, page) {
    this.pages[index] = page;
  }

  /**
   * You can define your own components
   *
   * @param {number} from - you can remove default components
   * @param {number} to - remove to
   * @param {object} components you can add new components
   */
  spliceComponents(from, to, components) {
    return this.components.splice(from, to, components);
  }

  close() {
    this.emit(this.constructor.Events.beforeClose);
    this.removeAllListeners();
    this.collector.stop();
  }

  updateMessage(target = null) {
    return this.message
      ? this._editMessage(target)
      : this._createMessage(target);
  }

  updateCurrentPageContent(value) {
    const { currentPage } = this;
    this.setPageAt(currentPage, value);
  }

  _createCollector() {
    this.collector = this.message.createMessageComponentCollector({
      time: MINUTE * 3,
    });
    this.collector.on("collect", (interaction) =>
      this._onCollect.call(this, interaction),
    );
    this.collector.once("end", () => this.emit("close"));
  }

  _getDefaultMessageProperties() {
    return {
      components: justButtonComponents(this.components),
      ...this.embed,
      ...this.pages.at(this.currentPage),
    };
  }

  async _editMessage(target) {
    target ||= this.message;
    return await this._renderPage(target, {
      ...this._getDefaultMessageProperties(),
      edit: true,
    });
  }

  async _createMessage(target) {
    target ||= this.channel;
    this.message = await this._renderPage(target, {
      ...this._getDefaultMessageProperties(),
    });
    this._createCollector();
    return this.message;
  }

  async _renderPage(target, value) {
    const event = {
      target,
      pager: this,
      createStopPromise,
      _createStopPromise_stoppers: [],
    };
    this.emit(this.constructor.Events.beforePageRender, event);
    await Promise.all(event._createStopPromise_stoppers);
    return target.msg(value);
  }
  _processDefaultComponents(Processor = DefaultComponentsProcessor) {
    const processor = new Processor(this);
    processor.process();
  }

  _onCollect(interaction) {
    this.emit(this.constructor.Events.component, interaction);
    this._callbacks[interaction.customId]?.call(this, interaction);
  }

  _callbacks = {
    [this.constructor.DefaultComponents.PREVIOUS.customId]: (interaction) => {
      if (!processUserCanUseInteraction(interaction, this)) {
        return;
      }
      this.currentPage--;
      this.updateMessage(interaction);
    },
    [this.constructor.DefaultComponents.NEXT.customId]: (interaction) => {
      if (!processUserCanUseInteraction(interaction, this)) {
        return;
      }
      this.currentPage++;
      this.updateMessage(interaction);
    },
    [this.constructor.DefaultComponents.SELECT.customId]: async (
      interaction,
    ) => {
      if (!processUserCanUseInteraction(interaction, this)) {
        return;
      }
      const result = await question({
        channel: interaction,
        user: interaction.user,
        message: {
          content: `Укажите номер страницы: (доступно ${ending(this.pages.length, "страниц", "", "а", "ы")})`,
          fetchReply: true,
          ephemeral: true,
        },
      });
      const value = +result.content?.match(/\d+/);
      if (!value || value > this.pages.length || value <= 0) {
        interaction.msg({
          edit: true,
          content: "Некорректное значение. Отмена",
        });
        return;
      }
      interaction.deleteReply();
      this.currentPage = +value - 1;
      await this.updateMessage();
    },
  };

  static Events = {
    beforeClose: "beforeClose",
    component: "component",
    beforePageRender: "beforePageRender",
  };

  static DefaultComponents = {
    PREVIOUS: { customId: "PREVIOUS", emoji: Emoji.green_arrow_left.id },
    NEXT: { customId: "NEXT", emoji: Emoji.green_arrow_right.id },
    SELECT: {
      customId: "SELECT",
    },
  };
}
