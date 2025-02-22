import config from "#config";
import { MINUTE } from "#constants/time.js";
import ErrorsHandler from "#src/ErrorsHandler/ErrorsHandler.js";
import { PERMISSIONS_MASK_ENUM } from "#src/VirtualMachine/empowered_permissions.js";
import { BankInteraction } from "#src/VirtualMachine/template_modules/BankInteraction.js";
import BossManager from "#src/boss/BossManager.js";
import client from "#src/bot/client/singleton.js";
import { singleton } from "#src/changelog/ChangelogDaemon/singleton.js";
import { requestCoinFromNextMessage } from "#src/coin_message/requestCoinFromMessage.js";
import CommandsManager from "#src/commands/CommandsManager/singleton.js";
import { CurseManager } from "#src/curses/CurseManager/singleton/index.js";
import * as PropertiesManager from "#src/data/Properties.js";
import { DataManager } from "#src/data/singleton.js";
import { pushMessage } from "#src/discord/pushMessage.js";
import { Emoji } from "#src/emojis/emojis.js";
import EventsManager from "#src/events/EventsManager.js";
import { timeEvents_singleton } from "#src/events/time/timeEvents_singleton.js";
import { transformToCollectionUsingKey } from "#src/nodejs/Collection/transformToCollectionUsingKey.js";
import QuestManager from "#src/quests/QuestManager.js";
import { use_memo } from "#src/safe-utils.js";
import ActionManager from "#src/user/actions/ActionManager.js";
import UserEffectManager from "#src/user/actions/EffectsManager.js";
import GuildVariablesManager from "#src/variables/GuildVariablesManager.js";
import { justButtonComponents } from "@zoodogood/utils/discordjs";
import { getRandomElementFromArray, omit } from "@zoodogood/utils/objectives";
import Discord, { Constants, FormattingPatterns } from "discord.js";
import mol_global from "mol_tree2";

export const template_modules_scope = transformToCollectionUsingKey([
	{
		getContent: (context) => {
			return context;
		},
		key: "interaction",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: () => Constants,
		key: "constants",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.USER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: () => config,
		key: "config",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: (context) => new GuildVariablesManager(context.guild.data),
		key: "CurrentGuildSpace",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.GUILD_MANAGER,
		},
		filter: (context) => "guild" in context,
	},
	{
		getContent: (context) => context.guild.data,
		key: "guildData",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.GUILD_MANAGER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
		filter: (context) => "guild" in context,
	},
	{
		getContent: (context) => context.user.data,
		key: "userData",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.USER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
		filter: (context) => "user" in context,
	},
	{
		getContent: () =>
			omit(Util, (key) =>
				[
					"GlitchText",
					"rangeToArray",
					"ending",
					"omit",
					"random",
					"sleep",
					"timestampDay",
					"timestampToDate",
					"resolveGithubPath",
					"yaml",
					"resolveDate",
					"inspect",
					"around",
					"uid",
					"NumberFormatLetterize",
				].includes(key),
			),
		key: "Util",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.USER,
			investigate: PERMISSIONS_MASK_ENUM.USER,
		},
	},
	{
		getContent: () => ErrorsHandler,
		key: "ErrorsHandler",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.USER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: () => CommandsManager,
		key: "CommandsManager",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: () => EventsManager,
		key: "EventsManager",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: () => UserEffectManager,
		key: "UserEffectManager",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: () => BossManager,
		key: "BossManager",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.USER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: () => CurseManager,
		key: "CurseManager",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.USER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: () => DataManager,
		key: "DataManager",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: () => timeEvents_singleton,
		key: "timeEvents",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: () => ActionManager,
		key: "ActionManager",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: () => QuestManager,
		key: "QuestManager",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.USER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: () => GuildVariablesManager,
		key: "GuildVariablesManager",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: () => PropertiesManager,
		key: "PropertiesManager",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.USER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: () => StorageManager,
		key: "StorageManager",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: () => Discord,
		key: "Discord",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: () => client,
		key: "client",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: () => process,
		key: "process",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: () => fetch,
		key: "fetch",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: () => FileSystem,
		key: "FileSystem",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: use_memo(() => JSON.parse(JSON.stringify(singleton))),
		key: "ChangelogDaemon",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.USER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent(context) {
			return (commandBase, params = "") => {
				const { CommandInteraction: CommandContext } = CommandsManager;
				const ctx = new CommandContext({
					commandBase,
					params,
					user: context.executor,
					channel: context.channel,
					message: context.message,
					guild: context.channel.guild,
				});
				ctx.mention = ctx.client.users.cache.get(
					params.match(FormattingPatterns.User)?.groups.id,
				);
				return (
					CommandsManager.checkAvailable(ctx.command, ctx) &&
					CommandsManager.execute(ctx.command, ctx)
				);
			};
		},
		key: "executeCommand",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.USER,
			investigate: PERMISSIONS_MASK_ENUM.USER,
		},
	},
	{
		getContent: (context) => {
			return ({ timer, template, hear } = {}) => {
				if (!hear) {
					throw new Error(
						"Nothing to hear: Example hear: {[(m'ActionsManager).Actions.coinFromMessage]: true}",
					);
				}
				timer ||= MINUTE * 3;
				timer = Math.min(timer, MINUTE * 3);
				const executorId = context.executor.id;
				return UserEffectManager.justEffect({
					user: context.user,
					effectId: "evaluateTemplate",
					values: { template, timer, hear, executorId },
				});
			};
		},
		key: "addEvaluateTemplateEffect",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.USER,
			investigate: PERMISSIONS_MASK_ENUM.USER,
		},
	},
	{
		getContent: () => mol_global,
		key: "mol_global",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: (context, source) => {
			return {
				confirm: "Это тестовое поле и всё ещё может сильно изменится",
				sendMessage(messagePayload) {
					const { user, channel, guild } = context;
					const target = guild ? channel : user;
					target.msg({
						...messagePayload,
						footer: {
							iconURL: context.executor.avatarURL(),
							text: `Это сообщение сгенерировано уполномоченным ${source.empowered.id}`,
						},
					});
				},
				guild: {
					confirm: "Вам нужно обладать правами в гильдии",
					removeGuild() {},
				},
			};
		},
		key: "message_api",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.USER,
			investigate: PERMISSIONS_MASK_ENUM.USER,
		},
	},
	{
		getContent: (context) => context.toSafeValues?.(),
		key: "safe_ctx",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.USER,
			investigate: PERMISSIONS_MASK_ENUM.USER,
		},
	},
	{
		key: "BankInteraction",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.GUILD_MANAGER,
			investigate: PERMISSIONS_MASK_ENUM.GUILD_MANAGER,
		},
		getContent: (context, source) => {
			if (!context.guild) {
				throw new Error("This module can be used only in guilds");
			}

			return new BankInteraction(context, source);
		},
	},
	{
		getContent: () => requestCoinFromNextMessage,
		key: "requestCoinFromNextMessage",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.DEVELOPER,
			investigate: PERMISSIONS_MASK_ENUM.DEVELOPER,
		},
	},
	{
		getContent: (context, source) => {
			return (customId) =>
				pushMessage(context.channel, {
					components: justButtonComponents({
						customId,
						emoji: getRandomElementFromArray(Object.values(Emoji)).toString(),
					}),
				});
		},
		key: "make_button",
		permissions: {
			scope: PERMISSIONS_MASK_ENUM.USER,
			investigate: PERMISSIONS_MASK_ENUM.USER,
		},
	},
]);
