import client from "#bot/client.js";
import { Emoji } from "#constants/emojis.js";
import { HOUR, SECOND } from "#constants/globals/time.js";
import { Bosses_Flagsubcommand } from "#folder/commands/boss.js";
import { default as CommmandInfo } from "#folder/commands/commandinfo.js";
import { BaseCommand, BaseFlagSubcommand } from "#lib/BaseCommand.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { MessageInterface } from "#lib/DiscordMessageInterface.js";
import { Pager } from "#lib/DiscordPager.js";
import { justModalQuestion } from "#lib/Discord_utils.js";
import DataManager from "#lib/modules/DataManager.js";
import TimeEventsManager from "#lib/modules/TimeEventsManager.js";
import {
  dayjs,
  ending,
  question,
  sleep,
  timestampDay,
  timestampToDate,
} from "#lib/util.js";
import { justButtonComponents } from "@zoodogood/utils/discordjs";
import { CliParser } from "@zoodogood/utils/primitives";
import {
  BaseInteraction,
  ButtonStyle,
  CategoryChannel,
  PermissionFlagsBits,
  escapeMarkdown,
} from "discord.js";

class Special {
  static process_hasManagePermissions(context, reason) {
    if (context.canManage()) {
      return true;
    }
    context.channel.msg({
      description: `Для этого действия необходимо право управлять сообщениями${reason ? `: ${reason}` : ""}`,
      delete: 8 * SECOND,
    });
    return false;
  }
  static processGuildPartner_isSetted(context, partnerField) {
    if (partnerField.isEnable) {
      return true;
    }
    context.channel.msg({
      description:
        "Используйте команду `!partners --setup` для настройки партнёрства",
      components: justButtonComponents(
        {
          label: "Партнёрства?",
          customId: `@command/partners/${Command.ComponentsCallbacks.show_help}`,
          style: ButtonStyle.Success,
        },
        {
          label: "--setup",
          customId: `@command/partners/${Command.ComponentsCallbacks.setup}`,
        },
      ),

      delete: 20 * SECOND,
    });
    return false;
  }
}

class PartnerField {
  static KEY = "partners";
  field;
  guild;
  deactive() {
    return (this.assert_field.isEnable = false);
  }
  enable() {
    return (this.assert_field.isEnable = true);
  }
  setChannel(channel) {
    this.assert_field.channelId = channel.id;
  }
  setGuild(guild) {
    this.guild = guild;
    this.field = guild.data[PartnerField.KEY] ||= {};
    return this;
  }
  async toMessageOptions() {
    return {
      title: `${escapeMarkdown(this.guild.name)}`,
      description: this.description,
      color: this.color,
      thumbnail: this.guild.iconURL(),
      fetchReply: true,
      fields: [
        {
          name: "**🔗 Ссылка на сервер**",
          value: this.isEnable
            ? `➡️ **[Вступить](${await this.endlessLink})**`
            : `~ Приглашение будет создано автоматически при настройке`,
        },
      ],
      footer: { text: ":palm_up_hand: " },
    };
  }
  get assert_field() {
    return (this.field ||= {});
  }
  get bumpedAt() {
    return this.field?.bumpedAt || 0;
  }
  set bumpedAt(value) {
    this.assert_field.bumpedAt = value;
  }
  get channelId() {
    return this.field?.channelId;
  }
  get color() {
    return this.field?.color;
  }
  set color(value) {
    this.assert_field.color = value;
  }

  get description() {
    return this.field?.description;
  }

  set description(value) {
    this.assert_field.description = value;
    this.enable();
  }

  get endlessLink() {
    return new Promise(async (resolve) => {
      if (!this.isEnable) {
        resolve(null);
        return;
      }
      if (this.assert_field.endlessLink) {
        resolve(this.assert_field.endlessLink);
        return;
      }
      const channel = this.guild.channels.cache.find(
        (channel) => channel instanceof CategoryChannel === false,
      );
      const invite = await channel.createInvite({
        maxAge: null,
        unique: false,
      });
      this.assert_field.endlessLink ||= invite?.url;
      resolve(this.assert_field.endlessLink);
    });
  }

  get isEnable() {
    return !!this.field?.isEnable;
  }
}

// MARK: Flags

class Search_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--search",
    capture: ["--search"],
    expectValue: true,
    description: "Укажите подстроку имени сервера для поиска",
  };

  onProcess() {
    const manager = new List_FlagSubcommand(this.context);
    const partners = manager
      .fetch()
      .filter(({ guildData }) => guildData.name.includes(this.value));
    manager.partners = partners;
    manager.createInterface(this.context.interaction);
  }
}

class Setup_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--setup",
    capture: ["-s", "--setup"],
    description: "Конфигурация партнёрств на сервере",
  };
  _interface = new MessageInterface();
  reactions = [
    {
      reaction: "🪧",
      label: "Описание (Обязательно)",
      key: "description",
      callback: async (interaction) => {
        const { content } = await question({
          user: interaction.user,
          channel: interaction.channel,
          message: {
            description: "Укажите описание для приглашения на сервер",
          },
        });
        this.context.partnerField.description = content;
        this.updateReactions();
        this._interface.updateMessage();
      },
    },
    {
      reaction: "🎨",
      label: "Боковой цвет",
      key: "color",
      callback: async (interaction) => {
        const { content } = await question({
          user: interaction.user,
          channel: interaction.channel,
          message: {
            description: "Укажите цвет в формате #2c2f33",
          },
        });
        const color = content.match(/^#[0-9a-f]{6}$/i)?.[0];
        if (!color) {
          interaction.msg({
            description: "Отменено",
            delete: 8 * SECOND,
          });
          return;
        }
        this.context.partnerField.color = color;
        this.updateReactions();
        this._interface.updateMessage();
      },
    },
    {
      reaction: "🗺️",
      label: "Обновить ссылку",
      key: "endlessLink",
      callback: async (interaction) => {
        delete this.context.partnerField.field.endlessLink;
        const link = await this.context.partnerField.endlessLink;
        if (!link) {
          interaction.msg({
            description:
              "Ссылка не была пересоздана, возможно, бот не имеет права создавать такие ссылки",
            delete: 8 * SECOND,
          });
        }
        interaction.msg({
          delete: 8 * SECOND,
          description: `Ссылка пересоздана:\n${link}`,
        });
      },
    },
    {
      reaction: "🏝️",
      label: "Канал для партнёрств",
      key: "channelId",
      callback: async () => {
        if (!(await new Channel_FlagSubcommand(this.context).onProcess())) {
          return;
        }
        this._interface.updateMessage();
      },
    },
    {
      reaction: "💥",
      label: "Деактивировать",
      isHidden: (context) => !context.partnerField.isEnable,
      callback: async () => {
        this.context.partnerField.deactive();
        this.updateReactions();
        this._interface.updateMessage();
      },
    },
    {
      reaction: "🟩",
      label: "Активировать",
      isHidden: ({ partnerField }) =>
        partnerField.isEnable || !partnerField.description,
      callback: async () => {
        this.context.partnerField.enable();
        this.updateReactions();
        this._interface.updateMessage();
      },
    },
  ];
  async _getEmbed() {
    const { partnerField } = this.context;
    const options = await partnerField.toMessageOptions();
    options.fields ||= [];
    options.fields.push(
      {
        name: "-- Управление",
        value: this.reactions
          .filter(({ isHidden }) => !isHidden?.(this.context))
          .map(
            ({ label, reaction, key }) =>
              `${reaction} — ${label} ${partnerField.field[key] ? Emoji.animation_tick_block.toString() : ""}`,
          )
          .join("\n"),
      },
      {
        name: "Партнёрства уже включены?",
        value: partnerField.isEnable
          ? "Да, вы можете использовать --bump! Но прежде убедитесь, что ваше послание информативно для пользователей"
          : `Нет. ${partnerField.description ? "Были отключены с вашей стороны" : "Активируются автоматически после указания описания"}`,
      },
      { name: "Необходимо право управления сервером", value: "Да" },
      {
        name: "Канал",
        value: partnerField.channelId
          ? `<#${partnerField.channelId}>`
          : "Не указан",
      },
    );
    return { ...options };
  }
  createInterface(channel) {
    this._interface.setChannel(channel);
    this._interface.setRender(() => this._getEmbed());
    this.updateReactions();
    this._interface.updateMessage();
    this._interface.setUser(this.context.user);
    this._interface.emitter.on(
      MessageInterface.Events.allowed_collect,
      this.onComponent.bind(this),
    );
    return this._interface;
  }
  async onComponent({ interaction }) {
    if (
      !Special.process_hasManagePermissions(
        this.context,
        "для настройки партнёрства",
      )
    ) {
      return;
    }
    await this.reactions
      .find(({ reaction }) => reaction === interaction.customId)
      ?.callback?.(interaction);
    this.updateReactions();
  }
  onProcess() {
    this.createInterface(this.context.interaction);
  }
  updateReactions() {
    const canManage = this.context.canManage();
    this._interface.setReactions(
      this.reactions
        .filter(({ isHidden }) => !isHidden?.(this.context) && canManage)
        .map(({ reaction }) => reaction),
    );
  }
}

class Preview_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--preview",
    capture: ["-p", "--preview"],
    description: "Показать сообщение партнёрства",
  };
  partnerField = new PartnerField();
  _getBossesContent() {
    return Bosses_Flagsubcommand.guildToField(this.guild).value;
  }
  _getClansContent() {}
  _getTreeContent() {
    return `Уровень дерева: ${this.guild.data.tree?.level || "ещё не появилось"}`;
  }
  async getEmbed() {
    const options = await this.partnerField.toMessageOptions();
    options.fields ||= [];
    options.fields.unshift(
      {
        name: "Босс",
        value: this._getBossesContent(),
        inline: true,
      },
      {
        name: "Дерево",
        value: this._getTreeContent(),
        inline: true,
      },
    );
    options.ephemeral = true;
    return options;
  }
  onProcess() {
    this.setGuild(this.context.guild);
    if (
      !Special.processGuildPartner_isSetted(this.context, this.partnerField)
    ) {
      return true;
    }
    this.sendPreview(this.context.interaction);
    return true;
  }
  async sendPreview(channel) {
    channel.msg(await this.getEmbed());
  }
  setGuild(guild) {
    this.guild = guild;
    this.partnerField.setGuild(guild);
    return this;
  }
}

class Bump_FlagSubcommand extends BaseFlagSubcommand {
  static BUMP_COOLDOWN = HOUR * 4;
  static FLAG_DATA = {
    name: "--bump",
    capture: ["-b", "--bump"],
    description:
      "Разослать приглашение о вступлении подписанным на партнёрство серверам",
  };
  async bump() {
    const { context } = this;
    const { guild } = context;
    const { id: guildId } = guild;
    const daemon = context.command.daemon;
    daemon.onPartnerBump(context);
    const options = await new Preview_FlagSubcommand(context)
      .setGuild(context.guild)
      .getEmbed();
    const targets = DataManager.data.guilds
      .filter((guildData) => {
        const field = guildData[PartnerField.KEY];
        if (!field) {
          return;
        }
        if (!field.isEnable || !field.channelId || guildData.id === guildId) {
          return;
        }
        return true;
      })
      .map((guildData) => guildData[PartnerField.KEY].channelId);

    targets.forEach((channelId) => {
      const channel = client.channels.cache.get(channelId);
      channel?.msg(options);
    });

    context.interaction.msg({
      description: `Разослано ${ending(targets.length, "сервер", "ам", "у", "ам")} 😦`,
      components: justButtonComponents({
        label: "Предпросмотр",
        customId: `@command/partners/${Command.ComponentsCallbacks.preview}`,
      }),
    });
  }

  onProcess() {
    if (
      !Special.processGuildPartner_isSetted(
        this.context,
        this.context.partnerField,
      )
    ) {
      return;
    }
    if (this.processPartnerAlreadyInPull() || !this.process_cooldown()) {
      return;
    }
    this.bump();
  }
  process_cooldown() {
    const field = this.context.partnerField;
    const cooldown_end =
      field.bumpedAt + Bump_FlagSubcommand.BUMP_COOLDOWN - Date.now();

    if (cooldown_end < 0) {
      field.bumpedAt = Date.now();
      return true;
    }

    const { interaction } = this.context;
    const percent = 1 - cooldown_end / Bump_FlagSubcommand.BUMP_COOLDOWN;
    const MAX_LINE_WIDTH = 30;
    const line = `\`[${"=".repeat(Math.ceil(percent * MAX_LINE_WIDTH))}${" ".repeat(Math.floor((1 - percent) * MAX_LINE_WIDTH))}]\` ${Math.ceil(percent * 100)}%`;
    interaction.msg({
      reference:
        interaction instanceof BaseInteraction ? null : interaction.message.id,
      description: `${line}\nПерезарядка: ${timestampToDate(cooldown_end)}\nКто-то уже бампнул до вас..`,
      fetchReply: true,
      footer: {
        iconURL: interaction.user.avatarURL(),
        text: interaction.user.username,
      },
      delete: 8 * SECOND,
    });
    return false;
  }
  processPartnerAlreadyInPull() {
    const daemon = this.context.command.daemon;
    const already = daemon.pull.isPartnerInPull(this.context.guild.id);
    if (!already) {
      return false;
    }

    const timestamp = daemon.fetchTimeEvent()?.timestamp;
    const indexOfQueque =
      daemon.pull.indexOf(this.context.guild.id) +
      daemon.pull.LIMIT -
      daemon.pull.length;
    this.context.interaction.msg({
      description: `Гильдия уже заметна! Через некоторое время очередь продвинется или очистится.\n!partners --daemon, — чтобы увидеть в какой части очереди Вы находитесь или время авто-чистки\nСерверов в очереди перед вами: ${indexOfQueque}. Очистится через: <t:${Math.floor(timestamp / SECOND)}:R>`,
      delete: 8 * SECOND,
    });
    return true;
  }
}

class Help_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--help",
    capture: ["-h", "--help"],
    description: "Получить обзор команды",
  };
  onProcess() {
    this.sendHelp(this.context.interaction);
  }
  sendHelp(channel) {
    return channel.msg({
      title: "Команда вызвана с параметром --help",
      description: `${this.context.command.options.media.description}.\n\nНастройте сообщение для вовлечения, а после используйте \`--bump\`, чтобы поделится сервером с теми, кто настроил партнёрство`,
      fields: [
        {
          name: "Кнопки",
          value: `❔ — Вызвать !commandinfo ${this.context.command.options.name}\n⬆️ — Вызвать !partners --bump`,
        },
      ],
      image: CommmandInfo.MESSAGE_THEME.poster,
      components: justButtonComponents(...this.components),
    });
  }

  get components() {
    const context = this.context;
    return [
      {
        label: "Настройка на сервере",
        customId: `@command/partners/${Command.ComponentsCallbacks.setup}`,
      },
      {
        label: "Предпросмотр",
        customId: `@command/partners/${Command.ComponentsCallbacks.preview}`,
        get disabled() {
          return !context.partnerField.isEnable;
        },
      },
      {
        label: "Партнёрства",
        customId: `@command/partners/${Command.ComponentsCallbacks.list}`,
      },
      {
        emoji: "⬆️",
        customId: `@command/partners/${Command.ComponentsCallbacks.bump}`,
        get disabled() {
          return !context.partnerField.isEnable;
        },
      },
      {
        emoji: "❔",
        customId: `@command/commandinfo/display:${context.command.options.name}`,
      },
    ];
  }
}

class List_FlagSubcommand_Filter {
  static Events = {
    update: "update",
  };
  _interface = new MessageInterface();

  filters = [
    {
      component: { label: "Есть босс", customId: "boss" },
      handleInteraction(interaction, filter) {
        filter.isEnable = !filter.isEnable;
        return { replitable: interaction };
      },
      check: (guildData) => guildData.boss?.isArrived,
    },
    {
      component: { label: "Имя сервера", customId: "name" },
      async handleInteraction(interaction, filter) {
        const { result, fields } = await justModalQuestion({
          title: "Имя сервера",
          components: [
            { label: "Поиск", placeholder: 'Введите "-", чтобы отключить' },
          ],
          interaction,
        });

        if (!result) {
          interaction.msg({
            content: "Не удалось получить имя сервера",
            ephemeral: true,
          });
          return { isFail: true };
        }
        const { value } = [...fields.values()].at(0);
        if (value === "-") {
          filter.isEnable = false;
          return { replitable: result };
        }

        filter.value = value;
        filter.isEnable = true;

        return { replitable: result };
      },
      params: { value: null },
      check: (guildData, filter) =>
        guildData.name.includes(filter.params.value),
    },
  ];

  constructor(parent, interaction) {
    this.parent = parent;
    this.interaction = interaction;
  }

  createInterface() {
    const { _interface, interaction } = this;
    _interface.setChannel(interaction.channel);
    _interface.setUser(interaction.user);

    _interface.setRender(() => ({
      description: "Используйте кнопки, чтобы переключать фильтры :point_down:",
      fetchReply: true,
      components: justButtonComponents(
        ...this.filters.map((filter) =>
          Object.assign(filter.component, {
            style: filter.isEnable
              ? ButtonStyle.Success
              : ButtonStyle.Secondary,
          }),
        ),
      ),
    }));
    _interface.emitter.on(
      MessageInterface.Events.allowed_collect,
      this.onComponent.bind(this),
    );
    _interface.updateMessage(interaction);
    return _interface;
  }

  async onComponent({ interaction }) {
    const filter = this.filters.find(
      ({ component }) => component.customId === interaction.customId,
    );
    if (!filter) {
      return;
    }
    const { replitable, isFail } = await filter.handleInteraction(
      interaction,
      filter,
    );
    if (isFail) {
      return;
    }
    const event = {
      response(options) {
        return replitable?.msg(options);
      },
      filter,
    };
    this._interface.emitter.emit(
      List_FlagSubcommand_Filter.Events.update,
      event,
    );
    await sleep(5000);
    this._interface.updateMessage();
  }
}

class List_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--list",
    capture: ["-l", "--list"],
    description: "Отобразить перечень всех гильдий участвующих в партнёрстве",
  };

  _interface = new Pager();
  filter_manager = null;
  partners = [];

  createInterface(channel) {
    const { _interface } = this;
    _interface.setChannel(channel);
    _interface.setRender(() => this.getEmbed());
    _interface.setPagesLength(this.partners.length);
    _interface.spliceComponents(
      0,
      0,
      justButtonComponents({
        label: "Фильтры",
        style: ButtonStyle.Success,
        customId: "filter",
        get disabled() {
          return !!this.filter_manager;
        },
      }),
    );
    _interface.updateMessage();
    _interface.emitter.on(
      Pager.Events.allowed_collect,
      this.onComponent.bind(this),
    );
  }
  fetch() {
    return DataManager.data.guilds
      .filter((guildData) => guildData[PartnerField.KEY]?.isEnable)
      .map((guildData) => ({
        guildData,
        field: guildData[PartnerField.KEY],
      }));
  }
  async getEmbed() {
    const index = this._interface.currentPage;
    const { guildData } = this.partners?.[index] || {};
    const guild = client.guilds.cache.get(guildData?.id);
    if (guild) {
      return await new Preview_FlagSubcommand(this.context)
        .setGuild(guild)
        .getEmbed();
    }

    return {
      description: "Погодите, но почему здесь пусто?",
    };
  }

  onComponent({ interaction }) {
    this.process_filter_component(interaction);
    this._interface.updateMessage();
  }

  onProcess() {
    this.partners = this.fetch();
    this.createInterface(this.context.interaction);
    return true;
  }

  process_filter_component(interaction) {
    if (interaction.customId !== "filter") {
      return;
    }
    if (this.filter_manager) {
      return;
    }
    this.filter_manager = new List_FlagSubcommand_Filter(this, interaction);
    this.filter_manager.createInterface();
    this.filter_manager._interface.emitter.on(
      List_FlagSubcommand_Filter.Events.update,
      ({ response, filter }) => {
        const previousLength = this.partners.length;
        this.partners = this.fetch().filter(({ guildData }) =>
          this.filter_manager.filters
            .filter(({ isEnable }) => isEnable)
            .every((filter) => filter.check(guildData, filter)),
        );
        const { length } = this.partners;
        response({
          description: `Использован фильтр ${filter.isEnable ? "" : "!"}${filter.component.label} ・ найдено серверов: ${previousLength} => ${length}`,
          ephemeral: true,
          edit: true,
        });
        this._interface.setPagesLength(length);
        this._interface.currentPage = Math.min(
          length,
          this._interface.currentPage,
        );
        this._interface.updateMessage();
      },
    );
  }
}

class Daemon_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--daemon",
    capture: ["-d", "--daemon"],
    description: "Система обновлений партнёрств",
  };

  daemon() {
    const { daemon } = this.context.command;
    return daemon;
  }

  getEmbed() {
    const daemon = this.daemon();
    const timestamp = daemon.fetchTimeEvent()?.timestamp;
    return {
      description: `:gear:\nПулл заполнен: ${daemon.pull.length}/${daemon.pull.LIMIT}. Чистка пула <t:${Math.floor(timestamp / SECOND)}:R>`,
    };
  }
  onProcess() {
    this.sendStats(this.context.interaction);
  }
  sendStats(channel) {
    channel.msg(this.getEmbed());
  }
}

class Channel_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--channel",
    capture: ["-c", "--channel"],
    description: "Получать приглашения от активных партнёрств",
  };

  async onProcess() {
    return await this.setupChannel();
  }
  process_parseChannel(context, value) {
    const channelId = value.match(/\d{16,22}/)?.[0];
    const channel = context.guild.channels.cache.get(channelId);
    if (channel) {
      return channel;
    }
    context.channel.msg({
      description: `Метка не является каналом или канал не найден, channelId: ${channelId}`,
      delete: 8 * SECOND,
    });
    return false;
  }
  async setupChannel() {
    const { interaction } = this.context;
    const { content } = await question({
      user: interaction.user,
      channel: interaction.channel,
      message: {
        description: "Укажите канал, куда будут отправляться парнёрства",
      },
    });
    const channel = await this.process_parseChannel(this.context, content);
    if (!channel) {
      return false;
    }
    this.context.partnerField.setChannel(channel);
    return true;
  }
}

// MARK: CommandRunContext
class CommandRunContext extends BaseCommandRunContext {
  captures;
  partnerField = new PartnerField();

  static async new(...params) {
    const context = new this(...params);
    context.partnerField.setGuild(context.guild);
    return context;
  }
  canManage() {
    return (this._canManage ||= this.guild.members
      .resolve(this.user)
      ?.permissions.has(PermissionFlagsBits.ManageGuild));
  }
  parseCli(input) {
    const parsed = new CliParser()
      .setText(input)
      .captureFlags(this.command.options.cliParser.flags)
      .collect();
    this.captures = parsed.captures;
    return parsed;
  }
}

class PartnersDaemon {
  EVENT_NAME = "partner-daemon";
  pull = new DaemonPull();
  _createTimeEvent() {
    TimeEventsManager.create(this.EVENT_NAME, this.ms_to_timeEvent());
  }
  checkTimeEvent() {
    const expected = this.fetchTimeEvent();

    if (!expected) {
      this._createTimeEvent();
    }
  }
  fetchTimeEvent() {
    const day = timestampDay(this.ms_to_timeEvent() + Date.now());
    return TimeEventsManager.findEventInRange(
      ({ name }) => name === this.EVENT_NAME,
      [day, day],
    );
  }
  ms_to_timeEvent() {
    return dayjs().endOf("week").add(2, "day").set("hour", 20) - Date.now();
  }
  onPartnerBump(context) {
    this.pull.push(context.guild.id);
  }
  onTimeEvent() {
    this.pull.empty();
    this._createTimeEvent();
  }
}

class DaemonPull extends Array {
  LIMIT = 20;
  isPartnerInPull(guildId) {
    return this.includes(guildId);
  }
  process_queue() {
    while (this.length > this.LIMIT) {
      this.shift();
    }
  }
  push(...values) {
    super.push(...values);
    this.process_queue();
  }
}

class Command extends BaseCommand {
  static ComponentsCallbacks = {
    show_help: "show_help",
    setup: "setup",
    preview: "preview",
    list: "list",
    bump: "bump",
  };
  componentsCallbacks = {
    [Command.ComponentsCallbacks.show_help]: async ({ interaction }) => {
      const context = await CommandRunContext.new(interaction, this);
      return new Help_FlagSubcommand(context).onProcess();
    },
    [Command.ComponentsCallbacks.setup]: async ({ interaction }) => {
      const context = await CommandRunContext.new(interaction, this);
      return new Setup_FlagSubcommand(context).onProcess();
    },
    [Command.ComponentsCallbacks.preview]: async ({ interaction }) => {
      const context = await CommandRunContext.new(interaction, this);
      return new Preview_FlagSubcommand(context).onProcess();
    },
    [Command.ComponentsCallbacks.list]: async ({ interaction }) => {
      const context = await CommandRunContext.new(interaction, this);
      return new List_FlagSubcommand(context).onProcess();
    },
    [Command.ComponentsCallbacks.bump]: async ({ interaction }) => {
      const context = await CommandRunContext.new(interaction, this);
      return new Bump_FlagSubcommand(context).onProcess();
    },
  };
  daemon;
  options = {
    name: "partners",
    id: 67,
    media: {
      description:
        "Объединяйтесь с другими серверами, которые используют бота Призрак. Ходите в гости",
      example: `!partners --help`,
    },
    alias:
      "партнёры партнёрства партнёрство партнёр партнеры партнерства партнерство партнер partner",
    allowDM: true,
    cooldown: 10_000,
    cooldownTry: 3,
    type: "guild",
    cliParser: {
      flags: [
        Setup_FlagSubcommand.FLAG_DATA,
        Preview_FlagSubcommand.FLAG_DATA,
        Bump_FlagSubcommand.FLAG_DATA,
        Help_FlagSubcommand.FLAG_DATA,
        List_FlagSubcommand.FLAG_DATA,
        Daemon_FlagSubcommand.FLAG_DATA,
        Channel_FlagSubcommand.FLAG_DATA,
        Search_FlagSubcommand.FLAG_DATA,
      ],
    },
    accessibility: {
      publicized_on_level: 7,
    },
  };
  constructor() {
    super();
    this.usePartnersDaemon();
  }
  async onChatInput(message, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }
  async processBump_flag(context) {
    const value = context.captures.get("--bump");
    if (!value) {
      return false;
    }
    await new Bump_FlagSubcommand(context).onProcess();
    return true;
  }
  async processChannel_flag(context) {
    const value = context.captures.get("--channel");
    if (!value) {
      return false;
    }
    await new Channel_FlagSubcommand(context).onProcess();
    return true;
  }
  async processDaemon_flag(context) {
    const value = context.captures.get("--daemon");
    if (!value) {
      return false;
    }
    await new Daemon_FlagSubcommand(context).onProcess();
    return true;
  }
  async processDefaultBehaviour(context) {
    await new Help_FlagSubcommand(context).onProcess();
    return true;
  }
  async processHelp_flag(context) {
    const value = context.captures.get("--help");
    if (!value) {
      return false;
    }
    await new Help_FlagSubcommand(context).onProcess();
    return true;
  }
  async processList_flag(context) {
    const value = context.captures.get("--list");
    if (!value) {
      return false;
    }
    await new List_FlagSubcommand(context).onProcess();
    return true;
  }
  async processPreview_flag(context) {
    const value = context.captures.get("--preview");
    if (!value) {
      return false;
    }
    await new Preview_FlagSubcommand(context).onProcess();
    return true;
  }
  async processSetup_flag(context) {
    const value = context.captures.get("--setup");
    if (!value) {
      return false;
    }
    await new Setup_FlagSubcommand(context).onProcess();
    return true;
  }
  /**
   *
   * @param {CommandRunContext} context
   * @returns {CommandRunContext}
   */
  async run(context) {
    context.parseCli(context.interaction.params);
    if (await this.processSetup_flag(context)) {
      return;
    }
    if (await this.processChannel_flag(context)) {
      return;
    }
    if (await this.processPreview_flag(context)) {
      return;
    }
    if (await this.processDaemon_flag(context)) {
      return;
    }
    if (await this.processHelp_flag(context)) {
      return;
    }
    if (await this.processBump_flag(context)) {
      return;
    }
    if (await this.processList_flag(context)) {
      return;
    }
    await this.processDefaultBehaviour(context);
    return;
  }
  usePartnersDaemon() {
    this.daemon = new PartnersDaemon(this);
    this.daemon.checkTimeEvent();
  }
}

export default Command;
export { PartnersDaemon };
