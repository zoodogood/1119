import { SECOND } from "#constants/globals/time.js";
import { default as CommmandInfo } from "#folder/commands/commandinfo.js";
import { BaseCommand, BaseFlagSubcommand } from "#lib/BaseCommand.js";
import {
	cli_parser_parse_flags,
	process_flags,
} from "#lib/BaseCommand/parse_flags.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { DataManager } from "#lib/DataManager/singleton.js";
import { Pager } from "#lib/DiscordPager.js";
import { justButtonComponents } from "@zoodogood/utils/discordjs";

class BugsField {
	static KEY = "bug";
	field;
	constructor() {
		this.field = DataManager.data.bot[BugsField.KEY] ||= {};
	}
}

// MARK: Flags
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
				customId: `@command/commandinfo/${context.command.options.name}`,
			},
		];
	}
}

class CommandDefaultBehaviour extends BaseFlagSubcommand {
	onProcess() {}
}

class List_FlagSubcommand extends BaseFlagSubcommand {
	static FLAG_DATA = {
		name: "--list",
		capture: ["-l", "--list"],
		description: "Отобразить перечень всех гильдий участвующих в партнёрстве",
	};

	_interface = new Pager();
	filters = {};
	partners = [];

	createInterface(channel) {
		const { _interface } = this;
		_interface.setChannel(channel);
		_interface.setRender(() => this.getEmbed());
		_interface.setPagesLength(this.partners.length);
	}
	fetch() {
		return DataManager.data.guilds
			.filter((guildData) => guildData[BugsField.KEY]?.isEnable)
			.map((guildData) => ({
				guildData,
				field: guildData[BugsField.KEY],
			}));
	}
	async getEmbed() {
		return {
			description: "Погодите, но почему здесь пусто?",
		};
	}

	onComponent({ interaction }) {
		this.process_filter_component(interaction);
	}

	onProcess() {
		this.sendList(this.context.interaction);
		return true;
	}

	sendList(channel) {
		this.partners = this.fetch();
		this.createInterface(channel);
	}
}

// MARK: RunContext
class CommandRunContext extends BaseCommandRunContext {
	static async new(...params) {
		const context = new this(...params);
		return context;
	}
}

class Command extends BaseCommand {
	options = {
		name: "bug",
		id: 2,
		media: {
			description: "Структурируйте информацию об ошибках, отправляйте запросы",
			example: `!bug например, команда эмбеды при использовании сразу говорит, что они не найдены, хотя в канале есть`,
		},
		alias: "баг",
		allowDM: true,
		expectParams: true,
		cooldown: 10 * SECOND,
		cooldownTry: 3,
		type: "dev",
		cliParser: {
			flags: [Help_FlagSubcommand.FLAG_DATA, List_FlagSubcommand.FLAG_DATA],
		},
		accessibility: {
			publicized_on_level: 2,
		},
		hidden: true,
	};
	async onChatInput(message, interaction) {
		const context = await CommandRunContext.new(interaction, this);
		context.setWhenRunExecuted(this.run(context));
		return context;
	}
	/**
	 *
	 * @param {CommandRunContext} context
	 * @returns {CommandRunContext}
	 */
	async run(context) {
		cli_parser_parse_flags(this, context);
		if (await process_flags(context)) {
			return;
		}
		await new CommandDefaultBehaviour(context).onProcess();
	}
}

export default Command;
