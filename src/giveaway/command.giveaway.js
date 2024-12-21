// @ts-check
import { SECOND, YEAR } from "#constants/time.js";
import { BaseCommand } from "#src/commands/BaseCommand/BaseCommand.js";
import { BaseCommandRunContext } from "#src/commands/CommandRunContext.js";
import { MessageInterface } from "#src/discord/MessageInterface.js";
import { PermissionsBits } from "#src/discord/permissions.js";
import { question } from "#src/discord/utils.js";
import { Emoji } from "#src/emojis/emojis.js";
import { timeEvents_singleton } from "#src/events/time/timeEvents_singleton.js";
import { timestampToDate } from "#src/safe-utils.js";
import { ParserTime } from "#src/user_input_prepare/parsers.js";
import { FormattingPatterns } from "discord.js";

class CommandRunContext extends BaseCommandRunContext {
	_interface = new MessageInterface();
	description;
	title;
	winnerRoleId;
	winners = 1;

	end() {
		this._interface.close();
		this._interface.message.delete();
		super.end();
	}

	interface_reactions() {
		// @ts-expect-error
		return this.command.reactions
			.filter(({ filter }) => !filter || filter(this))
			.map(({ emoji }) => emoji);
	}
}
class Command extends BaseCommand {
	options = {
		name: "giveaway",
		id: 45,
		media: {
			description:
				"Хотите порадовать участников сервера? Поднять планку ажиотажа? :tada:\nС помощью этой команды вы сможете разыграть награду между пользователями, а какую именно — решать только вам, будь это роль, ключик от игры или мешочек коинов?",
			example: `!giveaway #без аргументов`,
		},
		alias: "раздача розыгрыш розіграш",
		allowDM: true,
		type: "guild",
		userPermissions: PermissionsBits.ManageGuild,
	};
	reactions = [
		{
			emoji: "🪧",
			key: "title",
			label: "Текст",
			required: true,
			callback: async (interaction, context) => {
				const { channel, user } = interaction;

				const { content: title } = await question({
					message: { title: "Укажите заглавие" },
					user,
					channel,
				});

				if (!title) {
					return;
				}
				context.title = title;

				const { content: description } = await question({
					message: {
						title: `Укажите ${context.description ? "новое " : ""}описание этой раздачи`,
						description: context.description
							? `Старое: ${context.description}`
							: null,
					},
					user,
					channel,
				});

				if (!description) {
					return;
				}
				context.description = description;
			},
		},
		{
			emoji: "⏰",
			key: "timestamp",
			label: "Дата начала",
			required: true,
			callback: async (interaction, context) => {
				const { channel, user } = interaction;
				const now = new Date();
				const { content } = await question({
					message: {
						title: `Установите дату и время конца ивента`,
						description: `Вы можете указать что-то одно, числа разделенные точкой будут считаться датой, двоеточием — время\n**Вот несколько примеров:**\n22:00 — только время\n31.12 — только дата\n11:11 01.01 — дата и время\nОбратите внимание! Время сервера (${new Intl.DateTimeFormat(
							"ru-ru",
							{ weekday: "short", hour: "2-digit", minute: "2-digit" },
						).format(now)}) может отличается от вашего`,
					},
					channel,
					user,
				});
				if (!content) {
					return;
				}
				let parsed = ParserTime.toNumber(content) + Date.now();

				if (parsed < Date.now()) {
					const { emoji } = await question({
						message: {
							title: "Эта дата уже прошла, хотите установить на следующий год?",
						},
						user: interaction.user,
						channel: interaction.channel,
						reactions: ["685057435161198594", "763807890573885456"],
					});

					if (emoji === "685057435161198594") {
						parsed += YEAR;
					} else {
						context.channel.msg({
							title: "Операция отменена",
							delete: 8 * SECOND,
						});
						return;
					}
				}

				context.timestamp = parsed;
				interaction.msg({
					title: `Готово! Времени до окончания ~${timestampToDate(
						parsed - Date.now(),
						2,
					)}`,
					timestamp: parsed,
					delete: 8 * SECOND,
				});
			},
		},
		{
			emoji: "🎉",
			key: "winners",
			label: "Кол-во победителей",
			required: false,
			callback: async (interaction, context) => {
				const { content } = await question({
					message: {
						title: `Введите количество возможных победителей`,
					},
					channel: interaction.channel,
					user: interaction.user,
				});

				if (!content) {
					return;
				}
				if (isNaN(content)) {
					interaction.msg({
						title: "Указано не число",
						color: "#ff0000",
						delete: 3000,
					});
					return;
				}
				context.winners = Number(content);
			},
		},
		{
			emoji: "🎁",
			key: "winnerRoleId",
			label: "Выдаваемая роль",
			required: false,
			callback: async (interaction, context) => {
				const { content } = await question({
					message: { title: `Упомяните роль или введите её айди` },
					channel: interaction.channel,
					user: interaction.user,
				});

				if (!content) {
					return;
				}

				context.winnerRoleId = content.match(
					FormattingPatterns.Role,
				)?.groups.id;
			},
		},
		{
			emoji: "640449832799961088",
			required: false,
			label: "Опубликовать",
			hidden: true,
			callback: async (interaction, context) => {
				const giveaway = await interaction.msg({
					title: context.title,
					description: context.description,
					timestamp: context.timestamp,
					reactions: ["🌲"],
					color: "#4a7e31",
					footer: { text: "Окончание раздачи: " },
				});
				timeEvents_singleton.pushIntoQueue("giveaway", context.timestamp - Date.now(), [
					interaction.channel.id,
					giveaway.id,
					context.winners,
					context.winnerRoleId,
				]);

				context.end();
			},
			filter: (context) => context.timestamp && context.title,
		},
	];

	createInterface(context) {
		const { _interface } = context;
		_interface.setChannel(context.channel);
		_interface.setUser(context.user);
		_interface.setRender(() => {
			const fieldsContent = this.reactions
				.filter(({ hidden }) => !hidden)
				.map(({ emoji, key, label, required }) => {
					const icon = !context[key]
						? emoji
						: Emoji.animation_tick_block.toString();
					return `◖${icon} ${label}${required ? " 🚩" : ""}`;
				})
				.join("\n");
			return {
				title: "🌲 Создание раздачи",
				description: `Используйте реакции ниже, чтобы настроить раздачу!\n${fieldsContent}`,
				color: "#4a7e31",
				footer: { text: "🚩 Обязательные пункты перед началом" },
			};
		});
		_interface.setReactions(context.interface_reactions());
		_interface.emitter.on(
			MessageInterface.Events.allowed_collect,
			async ({ interaction }) => {
				await this.reactions
					.find(({ emoji }) => emoji === interaction.customId)
					?.callback(interaction, context);
				!context.isEnded &&
					_interface.setReactions(context.interface_reactions());
				!context.isEnded && _interface.updateMessage();
			},
		);
		_interface.updateMessage();
	}

	async onChatInput(msg, interaction) {
		const context = await CommandRunContext.new(interaction, this);
		context.setWhenRunExecuted(this.createInterface(context));
		return context;
	}
}

export default Command;
