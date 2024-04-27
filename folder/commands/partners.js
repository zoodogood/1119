import { BaseCommand } from "#lib/BaseCommand.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";

class Special {
  processGuildPartner_IsNotSetted() {}
  processValue_IsChannel(value) {}
}

class PartnerField {
  field;
  guild;
  setGuild() {}
}

class Setup_FlagSubcommand {
  static FLAG_DATA = {
    name: "--setup",
    capture: ["-s", "--setup"],
    description: "Конфигурация партнёрств на сервере",
  };
  constructor(context) {}
  onProcess() {}
  createInterface() {}
  setEnable(value) {}
  setDescription(value) {}
  setPartnersChannel(channel) {}
  regenerateEndlessLink() {}
  _createEndlessLink() {}
  _getEmbed() {}
}

class Preview_FlagSubcommand {
  static FLAG_DATA = {
    name: "--preview",
    capture: ["-p", "--preview"],
    description: "Показать сообщение партнёрства",
  };
  constructor(context) {}
  onProcess() {}
  sendPreview(channel) {}
  _getEmbed() {}
  _getClansContent(guild) {}
  _getTreeContent(guild) {}
  _getBossesContent(guild) {}
}

class Bump_FlagSubcommand {
  static FLAG_DATA = {
    name: "--bump",
    capture: ["-b", "--bump"],
    description:
      "Разослать приглашение о вступлении подписанным на партнёрство серверам",
  };
  constructor(context) {}
  onProcess() {}
  processPartnerAlreadyInPull() {}
}

class Help_FlagSubcommand {
  static FLAG_DATA = {
    name: "--help",
    capture: ["-h", "--help"],
    description: "Получить обзор команды",
  };
  constructor(context) {}
  onProcess() {}
  sendHelp(channel) {}
}

class List_FlagSubcommand {
  static FLAG_DATA = {
    name: "--list",
    capture: ["-l", "--list"],
    description: "Отобразить перечень всех гильдий участвующих в партнёрстве",
  };
  constructor(context) {}
  onProcess() {}
  sendHelp(channel) {}
}

class Daemon_FlagSubcommand {
  static FLAG_DATA = {
    name: "--daemon",
    capture: ["-d", "--daemon"],
    description: "Система обновлений партнёрств",
  };
  constructor(context) {}
  onProcess() {}
  sendStats(channel) {}
}

class Сhannel_FlagSubcommand {
  static FLAG_DATA = {
    name: "--channel",
    capture: ["-c", "--channel"],
    description: "Установить/отключить приглашения от активных партнёрств",
  };
  constructor(context) {}
  onProcess() {}
  sendStats(channel) {}
}

class CommandRunContext extends BaseCommandRunContext {
  parseCli(input) {}
  guildField = new PartnerField();
}

class PartnersDaemon {
  pull = new DaemonPull();
  constructor(command) {}
  checkTimeEvent() {}
  onPartnerBump(context) {
    this.pull.push(context.guild.id);
  }
  onTimeEvent() {
    this.pull.empty();
  }
  _createTimeEvent() {}
}

class DaemonPull {
  pull = [];
  push() {}
  empty() {}
  isPartnerInPull(guildId) {}
  getField() {}
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
  async run(context) {
    context.parseCli();
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
  onChatInput(message, interaction) {}
  processSetup_flag(context) {}
  processChannel_flag(context) {}
  processPreview_flag(context) {}
  processDaemon_flag(context) {}
  processHelp_flag(context) {}
  processBump_flag(context) {}
  processList_flag(context) {}
  processDefaultBehaviour(context) {}
  options = {
    name: "partners",
    id: 67,
    media: {
      description:
        "Объединяйтесь с другими серверами, которые используют бота Призрак. Ходите в гости",
      example: `!partners --help`,
    },
    alias:
      "партнеры партнёрства партнёрство партнёр партнерства партнерство партнер partner",
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
        Сhannel_FlagSubcommand.FLAG_DATA,
      ],
    },
    accessibility: {
      publicized_on_level: 2,
    },
    hidden: true,
  };
}

export default Command;
