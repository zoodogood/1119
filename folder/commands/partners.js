import { BaseCommand, BaseFlagSubcommand } from "#lib/BaseCommand.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import TimeEventsManager from "#lib/modules/TimeEventsManager.js";
import { SECOND } from "#constants/globals/time.js";
import { dayjs, timestampDay } from "#lib/util.js";
import { justButtonComponents } from "@zoodogood/utils/discordjs";
import { ButtonStyle } from "discord.js";
import { PermissionFlagsBits } from "discord.js";
import { CliParser } from "@zoodogood/utils/primitives";
import { default as CommmandInfo } from "#folder/commands/commandinfo.js";
import DataManager from "#lib/modules/DataManager.js";
import { Pager } from "#lib/DiscordPager.js";
import { rangeToArray } from "@zoodogood/utils/objectives";

class Special {
  static processGuildPartner_isSetted(context, partnerField) {
    if (partnerField.isEnable) {
      return true;
    }
    context.channel.msg({
      description:
        "Используйте команду `!partners --setup` для настройки партнёрства",
      components: justButtonComponents([
        {
          label: "Партнёрства?",
          customId: `@command/partners/${Command.ComponentsCallbacks.show_help}`,
          style: ButtonStyle.Success,
        },
        {
          label: "--setup",
          customId: `@command/partners/${Command.ComponentsCallbacks.setup}`,
        },
      ]),

      delete: 20 * SECOND,
    });
    return false;
  }
  static process_parseChannel(context, value) {
    const channelId = value.match(/\d{16, 22}/)?.[0];
    const channel = context.guild.channels.cache.get(channelId);
    if (channel) {
      return channel;
    }
    context.channel.msg({
      description: "Метка не является каналом",
      delete: 8 * SECOND,
    });
    return false;
  }
  static process_hasManagePermissions(context, reason) {
    const { user, guild } = context;
    const canManage = guild.members
      .resolve(user)
      ?.permissions.has(PermissionFlagsBits.ManageGuild);

    if (canManage) {
      return true;
    }
    context.channel.msg({
      description: `Для этого действия необходимо право управлять сообщениями${reason ? `: ${reason}` : ""}`,
      delete: 8 * SECOND,
    });
    return false;
  }
}

class PartnerField {
  static KEY = "partners";
  field;
  guild;
  setGuild(guild) {
    this.guild = guild;
    this.field = guild.data[PartnerField.KEY];
    return this;
  }
  get assert_field() {
    return (this.field ||= {});
  }
  get isEnable() {
    return !!this.field?.isEnable;
  }
  enable() {
    return (this.assert_field.isEnable = true);
  }
  get description() {
    return this.field?.description;
  }
  set description(value) {
    this.assert_field.description = value;
  }
  get color() {
    return this.field?.color;
  }
  set color(value) {
    this.assert_field.color = value;
  }
  get channel() {
    return this.field?.channel;
  }
  set channel(value) {
    this.assert_field.channel = value;
  }
}

// MARK: Flags

class Setup_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--setup",
    capture: ["-s", "--setup"],
    description: "Конфигурация партнёрств на сервере",
  };
  onProcess() {}
  createInterface() {}
  setEnable(value) {}
  setDescription(value) {}
  setPartnersChannel(channel) {}
  regenerateEndlessLink() {}
  _createEndlessLink() {}
  _getEmbed() {}
}

class Preview_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--preview",
    capture: ["-p", "--preview"],
    description: "Показать сообщение партнёрства",
  };
  onProcess() {}
  sendPreview(channel) {}
  _getEmbed() {}
  _getClansContent(guild) {}
  _getTreeContent(guild) {}
  _getBossesContent(guild) {}
}

class Bump_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--bump",
    capture: ["-b", "--bump"],
    description:
      "Разослать приглашение о вступлении подписанным на партнёрство серверам",
  };
  onProcess() {}
  processPartnerAlreadyInPull() {}
}

class Help_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--help",
    capture: ["-h", "--help"],
    description: "Получить обзор команды",
  };
  onProcess() {
    this.sendHelp(this.context.channel);
  }
  sendHelp(channel) {
    return channel.msg({
      title: "Команда вызвана с параметром --help",
      description: this.context.command.options.media.description,
      fields: [
        {
          name: "Кнопки",
          value: `❔ — Вызвать !commandinfo ${this.context.command.options.name}\n⬆️ — Вызвать !partners --bump`,
        },
      ],
      image: CommmandInfo.MESSAGE_THEME.poster,
      components: justButtonComponents(this.components),
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
          return !context.guildField.isEnable;
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
          return !context.guildField.isEnable;
        },
      },
      {
        emoji: "❔",
        customId: `@command/commandinfo/${context.command.options.name}`,
      },
    ];
  }
}

class List_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--list",
    capture: ["-l", "--list"],
    description: "Отобразить перечень всех гильдий участвующих в партнёрстве",
  };

  _interface = new Pager();
  partners = [];

  onProcess() {
    this.sendList(this.context.interaction);
    return true;
  }
  sendList(channel) {
    this.fetch();
    this.createInterface(channel);
  }
  fetch() {
    this.partners = DataManager.data.guilds
      .filter((guildData) => guildData[PartnerField.KEY])
      .map((guildData) => ({
        guildData,
        field: guildData[PartnerField.KEY],
      }));
  }

  createInterface(channel) {
    this._interface.setChannel(channel);
    this._interface.setRender(() => this.getEmbed());
    this._interface.setPagesLength(this.partners.length);
    this._interface.updateMessage();
  }

  getEmbed() {
    return { content: "123" };
  }
}

class Daemon_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--daemon",
    capture: ["-d", "--daemon"],
    description: "Система обновлений партнёрств",
  };

  onProcess() {}
  sendStats(channel) {}
}

class Channel_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--channel",
    capture: ["-c", "--channel"],
    description: "Установить/отключить приглашения от активных партнёрств",
  };

  onProcess() {}
  sendStats(channel) {}
}

// MARK: CommandRunContext
class CommandRunContext extends BaseCommandRunContext {
  static async new(...params) {
    const context = new this(...params);
    context.guildField.setGuild(context.guild);
    return context;
  }
  parseCli(input) {
    const parsed = new CliParser()
      .setText(input)
      .captureFlags(this.command.options.cliParser.flags)
      .collect();
    this.captures = parsed.captures;
    return parsed;
  }
  guildField = new PartnerField();
  captures;
}

class PartnersDaemon {
  pull = new DaemonPull();
  EVENT_NAME = "partner-daemon";
  checkTimeEvent() {
    const day = timestampDay(this.ms_to_timeEvent() + Date.now());
    const expected = TimeEventsManager.findEventInRange(
      ({ name }) => name === this.EVENT_NAME,
      [day, day],
    );

    if (!expected) {
      this._createTimeEvent();
    }
  }
  onPartnerBump(context) {
    this.pull.push(context.guild.id);
  }
  onTimeEvent() {
    this.pull.empty();
  }
  ms_to_timeEvent() {
    return dayjs().endOf("week").set("hour", 20) - Date.now();
  }
  _createTimeEvent() {
    TimeEventsManager.create(this.EVENT_NAME, this.ms_to_timeEvent());
  }
}

class DaemonPull {
  #pull = [];
  LIMIT = 20;
  push(...values) {
    this.#pull.push(...values);
    this.process_queue()();
  }
  process_queue() {
    while (this.#pull.length > this.LIMIT) {
      this.#pull.shift();
    }
  }
  empty() {
    this.#pull.empty();
  }
  isPartnerInPull(guildId) {
    return this.#pull.includes(guildId);
  }
  getField() {
    return this.#pull;
  }
}

class Command extends BaseCommand {
  constructor() {
    super();
    this.usePartnersDaemon();
  }
  daemon;
  usePartnersDaemon() {
    this.daemon = new PartnersDaemon(this);
    this.daemon.checkTimeEvent();
  }
  /**
   *
   * @param {CommandRunContext} context
   * @returns {CommandRunContext}
   */
  async run(context) {
    console.log(context);
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
  async onChatInput(message, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }
  onComponent({ params: raw, interaction }) {
    const [target, ...params] = raw.split(":");
    this.componentsCallbacks[target].call(this, interaction, ...params);
  }
  static ComponentsCallbacks = {
    show_help: "show_help",
    setup: "setup",
    preview: "preview",
    list: "list",
    bump: "bump",
  };
  componentsCallbacks = {
    [Command.ComponentsCallbacks.show_help]: () => {},
    [Command.ComponentsCallbacks.setup]: () => {},
    [Command.ComponentsCallbacks.preview]: () => {},
    [Command.ComponentsCallbacks.list]: () => {},
    [Command.ComponentsCallbacks.bump]: () => {},
  };
  async processSetup_flag(context) {
    const value = context.captures.get("--setup");
    if (!value) {
      return false;
    }
    await new Setup_FlagSubcommand(context).onProcess();
    return true;
  }
  async processPreview_flag(context) {
    const value = context.captures.get("--preview");
    if (!value) {
      return false;
    }
    await new Setup_FlagSubcommand(context).onProcess();
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
  async processHelp_flag(context) {
    const value = context.captures.get("--help");
    if (!value) {
      return false;
    }
    await new Help_FlagSubcommand(context).onProcess();
    return true;
  }
  async processBump_flag(context) {
    const value = context.captures.get("--bump");
    if (!value) {
      return false;
    }
    await new Bump_FlagSubcommand(context).onProcess();
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
  async processDefaultBehaviour(context) {
    await new Help_FlagSubcommand(context).onProcess();
    return true;
  }
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
      ],
    },
    accessibility: {
      publicized_on_level: 2,
    },
    hidden: true,
  };
}

export default Command;
export { PartnersDaemon };
