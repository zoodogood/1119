import config from "#config";
import {
	Collection,
	CommandInteraction as DiscordCommandInteraction,
} from "discord.js";

import CustomIdExecutor from "#src/app/CustomIdExecutor/Executor.js";

import { client } from "#src/bot/client/singleton.js";
import { permissionRawToI18n } from "#src/discord/permissions.js";
import { CustomCommand } from "#src/guildcommand/command.guildcommand.js";
import {
	joinWithAndSeparator,
	sleep,
	timestampToDate,
} from "#src/safe-utils.js";

import { SECOND } from "#constants/time.js";
import { BaseCommandRunContext } from "#src/commands/CommandRunContext.js";
import { take_missing_permissions } from "#src/discord/utils.js";
import { ErrorsHandler } from "#src/ErrorsHandler/ErrorsHandler.js";
import { ErrorMomentNotification } from "#src/ErrorsHandler/sendErrorInfo.js";
import { disposableListen, EventEmitter } from "#src/EventEmitter/export.js";
import { Actions } from "#src/user/actions/ActionManager.js";
import { ending } from "@zoodogood/utils/primitives";
import { glob } from "glob";

export const Events = {
	command_load: "command_load",
	signal_command_flow_end: "signal_command_flow_end",
};

const CommandCallCode = {
	cooldown: 0,
	removed: 1,
	dev: 2,
	dm: 3,
	mention: 4,
	params: 5,
};

export function callMapOf(command) {
	return [
		command.options.name,
		...command.options.alias.split(" "),
		command.options.slash?.name,
		String(command.options.id),
	].filter(Boolean);
}

export function resolve_command(command_name, source_guild) {
	return (
		CommandsManager.callMap.get(command_name) ||
		(() => {
			const custom_command = source_guild?.data.custom_commands?.[command_name];
			if (!custom_command) {
				return false;
			}
			return new CustomCommand(custom_command, source_guild);
		})()
	);
}

export class CommandInteraction {
	constructor({
		params,
		user,
		channel,
		guild,
		commandBase,
		message,
		client: custom_client,
	}) {
		/** @type {string | string[]} */
		this.params = params;
		/** @type {import("discord.js").User} */
		this.user = user;
		/** @type {import("discord.js").Channel} */
		this.channel = channel;
		/** @type {import("discord.js").Guild} */
		this.guild = guild;
		/** @type {string} */
		this.commandBase = commandBase;
		/** @type {import("discord.js").Message} */
		this.message = message;
		/** @type {import("discord.js").Client} */
		this.client = custom_client || client;

		/** @type {import("#src/commands/BaseCommand/BaseCommand.js").BaseCommand} */
		this.command = resolve_command(commandBase, guild);

		/** @type {import("discord.js").GuildMember} */
		this.member = guild?.members.resolve(user) || null;
		/** @type {import("#src/data/schema.js").users} */
		this.userData = user.data;
		/** @type {import("discord.js").User} */
		this.mention = message.mentions?.users.first() ?? null;
	}

	msg(payload) {
		// @ts-expect-error
		return this.channel.msg(payload);
	}

	toSafeValues() {
		// @ts-expect-error
		return { user: this.user.toSafeValues() };
	}
}
/**
 * @returns {CommandInteraction}
 */
function parseInputCommandFromMessage(message) {
	const content = message.content.trim();
	const PREFIX = "!";

	if (!content.startsWith(PREFIX)) {
		return null;
	}

	const words = content.split(" ").filter(Boolean);
	const spliceCommandBase = (words) => {
		const DEFAULT_BASE_LENGTH = 1;
		const prefixIsAlone = words.at(0) === PREFIX;

		const length = DEFAULT_BASE_LENGTH + Number(prefixIsAlone);

		const base = words.splice(0, length).join("");
		return base.slice(PREFIX.length).toLowerCase();
	};
	const commandBase = spliceCommandBase(words);
	const params = words.join(" ");

	const { client, author: user, channel, guild } = message;

	const commandContext = new CommandInteraction({
		commandBase,
		client,
		params,
		message,
		user,
		channel,
		guild,
	});

	commandContext.user.action(Actions.inputCommandParsed, commandContext);

	if (!commandContext.command) {
		return null;
	}
	return commandContext;
}

class CommandsManager {
	static callMap = new Map();
	static collection = new Collection();
	static CommandInteraction = CommandInteraction;

	static emitter = new EventEmitter();
	static EXECUTION_TYPES = {
		slash: {
			type: "slash",
			call: async (command, interaction) => {
				return await command.onSlashCommand(interaction);
			},
			condition: (interaction) =>
				interaction instanceof DiscordCommandInteraction,
		},
		input: {
			type: "input",
			call: async (command, interaction) => {
				command.options.removeCallMessage ? interaction.message.delete() : null;
				const output = await command.onChatInput(
					interaction.message,
					interaction,
				);
				return output;
			},
			condition: (interaction) => "message" in interaction,
		},
	};

	static is_static_commands_loaded = false;

	static parseInputCommandFromMessage = parseInputCommandFromMessage;

	/**
	 *
	 * @param {import("#src/commands/BaseCommand/BaseCommand.js").BaseCommand} command
	 * @param {CommandInteraction} interaction
	 */
	static checkAvailable(command, interaction) {
		const problems = [];
		const options = command.options;

		if (options.removed && interaction.user.id !== "921403577539387454") {
			problems.push({
				label: "Эта команда была удалена и не может быть использована",
				type: CommandCallCode.removed,
			});
		}

		if (
			options.type === "dev" &&
			!config.developers.includes(interaction.user.id)
		) {
			problems.push({
				label:
					"Эта команда находится в разработке и/или недоступна в публичной версии бота",
				type: CommandCallCode.dev,
			});
		}

		if (!options.allowDM && interaction.channel.isDMBased()) {
			problems.push({
				label: "Эта команда может быть вызвана только на сервере",
				type: CommandCallCode.dm,
			});
		}

		if (options.expectMention && !interaction.mention) {
			problems.push({
				label: "Вы не упомянули пользователя",
				type: CommandCallCode.mention,
			});
		}
		if (options.expectParams && !interaction.params) {
			problems.push({
				label: "Вы не указали аргументов",
				type: CommandCallCode.params,
			});
		}

		const clientWastedChannelPermissions =
			!interaction.channel.isDMBased() &&
			options.myChannelPermissions &&
			take_missing_permissions(
				interaction.guild.members.me,
				options.myChannelPermissions,
				interaction.channel,
			);

		if (clientWastedChannelPermissions.length) {
			const { locale } = interaction.user.data;
			const permissions = clientWastedChannelPermissions.map((string) =>
				permissionRawToI18n(string, locale),
			);
			const content = joinWithAndSeparator(permissions);
			problems.push({
				label: `Боту необходимы следующие права в этом канале: ${content}`,
				type: CommandCallCode.permissions,
			});
		}

		const clientWastedGuildPermissions =
			!interaction.channel.isDMBased() &&
			options.myPermissions &&
			take_missing_permissions(
				interaction.guild.members.me,
				options.myPermissions,
			);
		if (clientWastedGuildPermissions.length) {
			const { locale } = interaction.user.data;
			const permissions = clientWastedGuildPermissions.map((string) =>
				permissionRawToI18n(string, locale),
			);
			const content = joinWithAndSeparator(permissions);
			problems.push({
				label: `Боту необходимы следующие права в этой гильдии: ${content}`,
				type: CommandCallCode.permissions,
			});
		}

		const userWastedChannelPermissions =
			!interaction.channel.isDMBased() &&
			options.userChannelPermissions &&
			take_missing_permissions(
				interaction.member,
				options.userChannelPermissions,
				interaction.channel,
			);
		if (userWastedChannelPermissions.length) {
			const { locale } = interaction.user.data;
			const permissions = userWastedChannelPermissions.map((string) =>
				permissionRawToI18n(string, locale),
			);
			const content = joinWithAndSeparator(permissions);
			problems.push({
				label: `Вам необходимо обладать следующими правами внутри текущего канала: ${content}`,
				type: CommandCallCode.permissions,
			});
		}

		const userWastedGuildPermissions =
			!interaction.channel.isDMBased() &&
			options.userPermissions &&
			take_missing_permissions(interaction.member, options.userPermissions);
		if (userWastedGuildPermissions.length) {
			const { locale } = interaction.user.data;
			const permissions = userWastedGuildPermissions.map((string) =>
				permissionRawToI18n(string, locale),
			);
			const content = joinWithAndSeparator(permissions);
			problems.push({
				label: `Вам необходимо обладать следующими правами внутри гильдии: ${content} `,
				type: CommandCallCode.permissions,
			});
		}

		(() => {
			if (!options.cooldown) {
				return;
			}

			const cooldownApi = command._cooldown_api({ interaction });

			const cooldownFullEndAt = cooldownApi.getCurrentCooldownEnd();
			if (!cooldownFullEndAt) {
				return;
			}
			if (!cooldownApi.checkYet()) {
				return;
			}

			problems.push({
				label: `Команда применялась чаще рекомендованного: ${ending(cooldownApi.heat, "использовани", "й", "е", "я")} в **${timestampToDate(cooldownApi.perCall)}**`,
				type: CommandCallCode.cooldown,
			});
		})();

		if (problems.length === 0) {
			return true;
		}

		// help_message ↴
		const embed = {
			author: {
				iconURL: interaction.user.avatarURL(),
				name: interaction.user.username,
			},
			color: "#ff0000",
			delete: 20 * SECOND,
		};
		if (problems.length === 1) {
			embed.title = problems.at(0).label;
		}
		if (problems.length > 1) {
			embed.title = "Упс, образовалось немного проблемок:";
			embed.description = problems
				.map((problem) => `• ${problem.label}`)
				.join("\n");
		}
		interaction.message.msg(embed).then(async (message) => {
			const isHelpedNeeds =
				problems.find(($) => $.type === CommandCallCode.params) ||
				problems.find(($) => $.type === CommandCallCode.mention);
			if (!isHelpedNeeds) {
				return;
			}

			const react = await message.awaitReact(
				{ user: interaction.user, removeType: "all" },
				"❓",
			);
			if (!react) {
				return;
			}

			const helper = await CommandsManager.collection
				.get("commandinfo")
				.onChatInput(
					interaction.message,
					Object.assign(
						Object.create(CommandInteraction.prototype),
						interaction,
						{
							params: options.name,
						},
					),
				);
			await helper.whenRunExecuted;
			await sleep(30 * SECOND);
			helper.targetMessage.delete();
		});
		// help_message ↑

		if (
			problems.every((problem) => problem.type === CommandCallCode.cooldown)
		) {
			return true;
		}

		return false;
	}

	static async commandInstance(alias) {
		if (CommandsManager.callMap.has(alias)) {
			return CommandsManager.callMap.get(alias);
		}
		const { promise, resolve } = Promise.withResolvers();
		const dispose = disposableListen(
			CommandsManager.emitter,
			Events.command_load,
			(command) => {
				callMapOf(command).includes(alias) && resolve(command);
			},
		);
		const instance = await promise;
		dispose();
		return instance;
	}

	/**
	 *
	 * @param {import("#src/commands/BaseCommand/BaseCommand.js").BaseCommand} command
	 * @param {CommandInteraction} interaction
	 */
	static async execute(command, interaction, { preventCooldown = false } = {}) {
		const context = this.getExecuteContext({
			command,
			interaction,
			preventCooldown,
		});
		const { options, typeBase } = context;

		let execution_context;
		try {
			interaction.user.action(Actions.callCommand, { command, interaction });
			const whenCommandEnd = typeBase.call(command, interaction);

			this.emitter.emit("command", interaction);

			options.cooldown &&
				!preventCooldown &&
				command._cooldown_api(context).call();

			execution_context = await whenCommandEnd;
			if (execution_context instanceof BaseCommandRunContext) {
				await execution_context.whenRunExecuted;
				execution_context.emitter.emit(Events.signal_command_flow_end);
			}

			command._statistic_increase(context);
		} catch (error) {
			await command._error_strategy(error, context, execution_context);
		}
		return execution_context;
	}

	static getExecuteContext(primary) {
		const { command, interaction } = primary;
		const options = command.options;
		const typeBase = Object.values(this.EXECUTION_TYPES).find(({ condition }) =>
			condition(interaction),
		);

		return { ...primary, typeBase, options };
	}

	static async importFolderCommands() {
		const commands = await Promise.all(
			(await glob("**/command.*.js", { absolute: true })).map((path) =>
				import(path).then((module) => new module.default()),
			),
		);

		/**
		 * @type [string, import("#src/commands/BaseCommand/BaseCommand.js").BaseCommand][]
		 */
		const entries = commands.map((command) => [command.options.name, command]);
		for (const [key, command] of entries) {
			CommandsManager.collection.set(key, command);
			callMapOf(command).forEach((alias) => this.callMap.set(alias, command));
		}
		CommandsManager.is_static_commands_loaded = true;
	}
}

CustomIdExecutor.bind("command", async (target, data) => {
	try {
		await CommandsManager.callMap.get(target).onComponent(data);
	} catch (error) {
		const { interaction } = data;
		ErrorMomentNotification.sendErrorInfo({
			channel: interaction.channel,
			error,
			interaction,
			primary: data,
			description: `Сбой при выполнении команды \`${target}\``,
		});
		ErrorsHandler.onErrorReceive(error, data);
	}
});

CommandsManager.importFolderCommands();

export { CommandsManager, parseInputCommandFromMessage };
export default CommandsManager;
