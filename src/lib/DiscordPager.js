import { CustomCollector, question, ending } from "#lib/util.js";
import { Emoji } from "#constants/emojis.js";
import { MINUTE } from "#constants/globals/time.js";
import { CreateModal, justButtonComponents } from "@zoodogood/utils/discordjs";
import { TextInputStyle, ComponentType } from "discord.js";
import {
  MessageInterface,
  MessageInterface_Options,
} from "#lib/DiscordMessageInterface.js";

class DefaultComponentsProcessor {
  callbaks;
  /**@type {Pager} */
  pager;
  constructor(pager) {
    this.pager = pager;
    this._initCallbacks();
  }

  _initCallbacks() {
    const { Next, Previous, Select } = Pager.DefaultComponents;
    this.callbacks = {
      [Previous.customId]: (component) => {
        Object.defineProperty(component, "disabled", {
          get: () => this.pager.currentPage === 0,
          enumerable: true,
        });
      },
      [Next.customId]: (component) => {
        Object.defineProperty(component, "disabled", {
          get: () =>
            !this.pager.pages.length ||
            this.pager.currentPage === this.pager.pages.length - 1,
          enumerable: true,
        });
      },
      [Select.customId]: (component) => {
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

  process() {
    const { DefaultComponents } = Pager;
    const components = justButtonComponents(
      ...Object.values(structuredClone(DefaultComponents)),
    );
    this.processIsDisabledGetters(components);
    this.pager.options.components.push(...components);
  }

  processIsDisabledGetters(components) {
    for (const component of components) {
      this.callbacks[component.customId]?.(component);
    }
  }
}

export const Pager_selectPageStrategy = {
  async Message(pager, interaction) {
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
    });
  },
};

class Pager_Options extends MessageInterface_Options {
  selectPageStrategy = Pager_selectPageStrategy.Modal;
}

export class Pager extends MessageInterface {
  _callbacks = {
    [Pager.DefaultComponents.Previous.customId]: (interaction) => {
      this.currentPage--;
      this.updateMessage(interaction);
    },
    [Pager.DefaultComponents.Next.customId]: (interaction) => {
      this.currentPage++;
      this.updateMessage(interaction);
    },
    [Pager.DefaultComponents.Select.customId]: async (interaction) => {
      this.options.selectPageStrategy(this, interaction);
    },
  };
  currentPage = 0;
  static DefaultComponents = {
    Previous: { customId: "PAGER_PREVIOUS", emoji: Emoji.green_arrow_left.id },
    Next: { customId: "PAGER_NEXT", emoji: Emoji.green_arrow_right.id },
    Select: {
      customId: "PAGER_SELECT",
    },
  };

  static Events = {
    ...super.Events,
  };

  options = new Pager_Options();

  pages = [];

  constructor(channel) {
    super();
    this.setChannel(channel);
    this._processDefaultComponents();
  }

  async _getMessageOptions() {
    const properties = await super._getMessageOptions();
    return {
      ...properties,
      ...this.pages[this.currentPage],
    };
  }

  _onCollect(type, interaction) {
    const data = super._onCollect_processData(type, interaction);
    data.isAllowed &&
      this._callbacks[interaction.customId]?.call(this, interaction);
    super._onCollect_emit(data);
  }

  _processDefaultComponents(Processor = DefaultComponentsProcessor) {
    const processor = new Processor(this);
    processor.process();
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

  setSelectPageStrategyOption(strategy) {
    this._setOptions({ selectPageStrategy: strategy });
    return this;
  }

  /**
   * You can define your own components
   *
   * @param {number} from - you can remove default components
   * @param {number} to - remove to
   * @param {object[]} components you can add new components
   */
  spliceComponents(from, to, components) {
    const { options } = this;
    return options.components.splice(from, to, ...components);
  }

  updateCurrentPageContent(value) {
    const { currentPage } = this;
    this.setPageAt(currentPage, value);
  }
}
