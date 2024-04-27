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
  constructor(context) {}
  onProcess() {}
  sendPreview(channel) {}
  _getEmbed() {}
  _getClansContent(guild) {}
  _getTreeContent(guild) {}
  _getBossesContent(guild) {}
}

class Bump_FlagSubcommand {
  constructor(context) {}
  onProcess() {}
  processPartnerAlreadyInPull() {}
}

class Help_FlagSubcommand {
  constructor(context) {}
  onProcess() {}
  sendHelp(channel) {}
}

class CommandRunContext extends BaseCommandRunContext {
  parseCli(input) {}
  guildField = new PartnerField();
}

class PartnersDaemon {
  pull;
  constructor(command) {}
  checkTimeEvent() {}
  onPartnerBump(context) {
    this.pull.push(context.guild.id);
  }
  onTimeEvent() {
    this.pull.empty();
  }
  _createTimeEvent() {}
  sendStats(channel) {}
}

class DaemonPull {
  empty() {}
  isPartnerInPull(guildId) {}
  getField() {}
}

class Command extends BaseCommand {
  constructor() {}
  usePartnersDaemon() {}
  run(context) {}
  onChatInput(message, interaction) {}
  processSetup_flag(context) {}
  processChannel_flag(context) {}
  processPreview_flag(context) {}
  processDaemon_flag(context) {}
  processHelp_flag(context) {}
  processBump_flag(context) {}
  processDefaultBehaviour(context) {}
	options = {
		name: "partners",
		id: 67,
		media: {
			description:
				"Объединяйтесь с другими серверами, которые используют бота Призрак. Ходите в гости",
			example: `!partners --help`
		},
		alias: "партнеры партнёрства",
		allowDM: true,
		cooldown: 10_000,
		cooldownTry: 3,
		type: "guild",
		cliParser: {
			flags: [
				{
					name: "--json",
					capture: ["-j", "--json"],
					description: "Возвращает *.json задачи",
				},
				{
					name: "--todo-add",
					capture: ["-j", "--json"],
					description: "Возвращает *.json задачи",
				},
			],
		},
		accessibility: {
			publicized_on_level: 2,
		},
	}
  };
}
