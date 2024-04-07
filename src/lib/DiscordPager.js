import { CustomCollector, question, ending } from "#lib/util.js";
import { Emoji } from "#constants/emojis.js";
import { MINUTE } from "#constants/globals/time.js";
import { createStopPromise } from "#lib/createStopPromise.js";
import { CreateModal, justButtonComponents } from "@zoodogood/utils/discordjs";
import { TextInputStyle, ComponentType } from "discord.js";
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

class AbstractHideDisabledComponents {
  static needHide(pager, component) {
    return pager.hideDisabled ? !component.disabled : true;
  }
}

class DefaultComponentsProcessor {
  callbacks;
  constructor(pager) {
    this.pager = pager;
    this._initCallbacks();
  }

  process() {
    const { DefaultComponents } = this.pager.constructor;
    const components = justButtonComponents(
      Object.values(structuredClone(DefaultComponents)),
    );
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

export const Pager_selectPageStrategy = {
  async Message(pager, interaction) {
    if (!processUserCanUseInteraction(interaction, pager)) {
      return;
    }
    const result = await question({
      channel: interaction,
      user: interaction.user,
      message: {
        content: `Укажите номер страницы: (доступно ${ending(pager.pages.length, "страниц", "", "а", "ы")})`,
        fetchReply: true,
        ephemeral: true,
      },
    });
    const value = +result.content?.match(/\d+/);
    if (!value || value > pager.pages.length || value <= 0) {
      interaction.msg({
        edit: true,
        content: "Некорректное значение. Отмена",
      });
      return;
    }
    interaction.deleteReply();
    pager.currentPage = +value - 1;
    await pager.updateMessage();
  },
  async Modal(pager, interaction) {
    const { user } = interaction;
    const TITLE = "Перейти к странице";
    const customId = "pager_pageSelectValue";

    const components = {
      type: ComponentType.TextInput,
      style: TextInputStyle.Short,
      label: "Укажите число",
      placeholder: `Доступно страниц: ${pager.pages.length}`,
      customId,
    };
    const modal = CreateModal({ customId, title: TITLE, components });
    await interaction.showModal(modal);

    const filter = ([interaction]) =>
      customId === interaction.customId && user === interaction.user;
    const collector = new CustomCollector({
      target: interaction.client,
      event: "interactionCreate",
      filter,
      time: MINUTE * 5,
    });
    collector.setCallback((interaction) => {
      collector.end();

      const value =
        +interaction.fields.getField(customId).value - 1 || pager.currentPage;
      pager.currentPage = Math.max(Math.min(pager.pages.length, value), 1);
      pager.updateMessage(interaction);
      return;
    });
  },
};

export class Pager extends EventsEmitter {
  message = null;
  channel = null;
  components = [];
  pages = [];
  embed = {};
  currentPage = 0;
  user = null;
  selectPageStrategy = Pager_selectPageStrategy.Modal;
  hideDisabled = false;

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

  setPagesLength(length) {
    this.pages.length = length;
  }

  /**
   * You can define your own components
   *
   * @param {number} from - you can remove default components
   * @param {number} to - remove to
   * @param {object[]} components you can add new components
   */
  spliceComponents(from, to, components) {
    return this.components.splice(from, to, ...components);
  }

  setComponents(components) {
    this.components = components;
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

  setSelectPageStrategyOption(strategy) {
    this.selectPageStrategy = strategy;
  }

  setHideDisabledOption(value) {
    this.hideDisabled = value;
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
      components: this.components.filter(
        AbstractHideDisabledComponents.needHide.bind(null, this),
      ),
      ...this.embed,
      ...this.pages[this.currentPage],
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
      value,
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
      this.selectPageStrategy(this, interaction);
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
