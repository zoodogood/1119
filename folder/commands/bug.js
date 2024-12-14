import client from "#bot/client.js";
import {
	multiline,
	question,
	transformToCollectionUsingKey,
} from "#bot/util.js";
import config from "#config";
import { SECOND } from "#constants/globals/time.js";
import { mol_tree2_string_from_json } from "#lib/$mol.js";
import { BaseCommand, BaseFlagSubcommand } from "#lib/BaseCommand.js";
import {
	cli_parser_parse_flags,
	flag_value,
	process_flags,
} from "#lib/BaseCommand/parse_flags.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { DataManager } from "#lib/DataManager/singleton.js";
import { justModalQuestion, parse_embedInstance } from "#lib/Discord_utils.js";
import { MessageInterface } from "#lib/DiscordMessageInterface.js";
import { ErrorsHandler } from "#lib/modules/mod.js";
import { uid } from "#lib/safe-utils.js";
import { justButtonComponents } from "@zoodogood/utils/discordjs";
import { ComponentType, escapeCodeBlock } from "discord.js";

import { assert, process_startedAt } from "#lib/util.js";

function insertBugInfo({
	reportId,
	importanceStatusIndex,
	error_message,
	reportText,
	reporterId,
	session,
	informMessageId,
}) {
	new BugsField().field[reportId] = {
		importanceStatusIndex,
		error_message,
		reportText,
		reportId,
		reporterId,
		session,
		informMessageId,
	};
}
function informBugToBugChannel({
	importanceStatus,
	error_message,
	reportText,
	reportId,
}) {
	const target = client.channels.cache.get(config.guild.bugsChannelId);
	return target.msg({
		title: "Отчёт об ошибке",
		description: multiline([
			"Статус важности ошибки:\n",
			importanceStatus?.label || "Не указан",
			"\n",
			"Текст отчёта:\n",
			reportText,
			"\n\n",
			"Идентификатор ошибки:\n",
			error_message,
		]),
		footer: { text: reportId },
		components: justButtonComponents(
			{
				customId: `@command/bug/update_error_message_status:unique:${reportId}`,
				label: "— Уникален",
			},
			{
				customId: `@command/bug/update_error_message_status:not_a_bug:${reportId}`,
				label: "— Опровергнут",
			},
			{
				customId: `@command/bug/update_error_message_status:related:${reportId}`,
				label: "Связать с предшествующим",
			},
		),
	});
}

function update_error_message_status(context) {
	const { interaction, user } = context;
	if (!config.developers.includes(user.id)) {
		interaction.msg({
			ephemeral: true,
			content: `Данное взаимодействие доступно только <@${config.developers[0]}>`,
		});
		return;
	}
	const [command, reportId] = context.params;
	const bug = new BugsField().field[reportId];

	assert(bug);
	switch (command) {
		case "unique":
			return (() => {
				const informMessage = interaction.message;

				informMessage.msg({
					components: justButtonComponents({
						label: "Объявить исправленым",
						customId: `@command/bug/update_error_message_status:fixed:${reportId}`,
					}),
					...parse_embedInstance(informMessage.embed),
					footer: { text: "Принят как уникальная ошибка" },
					edit: true,
				});

				const user = client.users.cache.get(bug.reporterId);
				user.msg({
					content: multiline([
						"Отчёт об ошибке принят со статусом уникальной ошибки\n",
						"Пожалуйста, примите вознаграждение в размере 2 000 коинов",
					]),
				});
				user.data.coins += 2_000;
				interaction.msg({
					content: `${interaction.customId} — успех`,
					ephemeral: true,
				});
			})();
		case "not_a_bug":
			return (async () => {
				const informMessage = interaction.message;
				informMessage.msg({
					components: [],
					...informMessage.embed,
					footer: { text: "Помечено как то что не является багом" },
					edit: true,
				});
				interaction.msg({
					content: `${interaction.customId} — успех`,
					ephemeral: true,
				});
				const user = client.users.cache.get(bug.reporterId);
				user.msg({
					content: "Отправленный отчёт об ошибке: не являлось багом",
				});
			})();
		case "related":
			return (async () => {
				const informMessage = interaction.message;

				const target_message = await (async () => {
					const { value } = await question({
						channel: interaction,
						user: interaction.user,
						message: {
							content: "Ответьте на сообщение, чтобы прикрепить",
							ephemeral: true,
							fetchReply: true,
						},
					});
					const target_message_id = value.reference.messageId;

					return await client.channels.cache
						.get(config.guild.bugsChannelId)
						.messages.fetch(target_message_id);
				})();

				const thread =
					target_message.thread ||
					(await target_message.startThread({
						name: "Больше",
					}));

				const message = await thread.msg({
					...parse_embedInstance(informMessage.embed),
				});
				assert(message.id);
				informMessage.delete();

				const user = client.users.cache.get(bug.reporterId);
				user.msg({
					content:
						"Отправленный отчёт об ошибке: связан с предшествующим отчётом об этой же ошибке",
				});
			})();
		case "fixed":
			return (async () => {
				const informMessage = interaction.message;
				bug.isFixed = true;
				informMessage.msg({
					components: justButtonComponents({
						label: "Исправлено!",
						disabled: true,
					}),
					...parse_embedInstance(informMessage.embed),
					edit: true,
				});
				interaction.msg({
					content: `${interaction.customId} — успех`,
					ephemeral: true,
				});
			})();
	}
}

class BugsField {
	static KEY = "bug";
	field;
	constructor() {
		this.field = DataManager.data.bot[BugsField.KEY] ||= {};
	}
}

const Importances = transformToCollectionUsingKey([
	{
		label: "Опасно",
		key: "Dangerous",
		value: "0",
		description: "Имеет необратимые последствия",
	},
	{
		label: "Необходимо",
		key: "Needed",
		value: "1",
	},
	{
		label: "Мешает",
		key: "Disturbs",
		value: "2",
		description: "Можно обойти или проблема незначительна",
	},
	{
		label: "Cпокойно",
		key: "Calmy",
		value: "3",
		description: "Возможно, опечатка?",
	},
]);

class CommandDefaultBehaviour extends BaseFlagSubcommand {
	// file:@sendErrorInfo
	static ErrorMomentNamespace = class {
		onProcess() {}
		setContext(parent, context) {
			this.parent = parent;
			this.context = context;
			return this;
		}
	};
	_interface = new MessageInterface();

	error_moment = new CommandDefaultBehaviour.ErrorMomentNamespace();

	importanceStatus = null;

	async askReportText(interaction) {
		const components = [
			{
				label: "Вы открыли окно уведомления об ошибке",
				required: true,
				maxLength: 1_000,
				value: flag_value(this.context, "--text") || undefined,
				placeholder: "Опишите причинно-следственную связь",
			},
		];

		const { response, fields } = await justModalQuestion({
			interaction,
			title: "Отправить",
			components,
		});

		if (!response) {
			return;
		}
		const { value: reportText } = [...fields.values()].at(0);
		const bugInfo = {
			importanceStatus: this.importanceStatus,
			importanceStatusIndex: parseInt(this.importanceStatus?.value || "-1"),
			importanceStatusLabel: this.importanceStatus?.label || "Не указан",
			error_moment: this.error_moment,
			error_message: this.error_moment.context?.error.message,
			reportText,
			reportId: uid(),
			reporterId: interaction.user.id,
			session: process_startedAt(),
			informMessageId: null,
		};
		const content = multiline([
			"Спасибо\nДанные об ошибке опубликованы\n",
			(() => {
				const { context: error_context } = this.error_moment;
				if (!error_context) {
					return undefined;
				}
				const { error, primary } = error_context;
				const group = ErrorsHandler.getErrorsGroupBy(error.message);
				group.addReport(bugInfo.reportId);
				return multiline([
					"\n",
					"Момент ошибки:\n",
					`Идентификатор ошибки:\n${error.message}\n`,
					primary &&
						multiline([
							"\n",
							"Дополнильные данные:\n",
							"```tree\n",
							escapeCodeBlock(mol_tree2_string_from_json(primary)),
							"\n```\n",
						]),
				]);
			})(),
			`Статус важности ошибки: ${this.importanceStatus?.label || "Не указан"}\n`,
			"\nОшибки отправляются по адресу ла-ла-ла\n",
		]);
		response.msg({ content });
		const inform = await informBugToBugChannel(bugInfo);
		bugInfo.informMessageId = inform.id;
		insertBugInfo(bugInfo);
	}
	onProcess() {
		const { _interface, context } = this;
		const { interaction } = context;
		context.options.error_moment_context &&
			this.error_moment
				.setContext(this, context.options.error_moment_context)
				.onProcess();

		_interface.setChannel(interaction);
		_interface.setUser(interaction.user);
		_interface.setRender(() => {
			return {
				description: multiline([
					"Рекомендации по улучшению конструктивной обратной связи",
					"\n\n",
					`- Если вы имеете аккаунт Github и желаете участвовать в обсуждении данной проблемы, `,
					`${config.enviroment.github}/issues\n`,
					"Пожалуйста, указывайте\n",
					"«Ожидаемое поведение:\n…\n",
					"и текущее поведение:\n…\n",
					"Этих двух пунктов часто хватает чтобы оценить суть происходящего",
				]),
				fetchReply: true,
				author: {
					iconURL: interaction.user.avatarURL(),
					name: interaction.user.username,
				},
			};
		});
		_interface.setComponents([
			[
				{
					type: ComponentType.StringSelect,
					options: [...Importances.values()],
					customId: "setImportance",
					placeholder: "Важность проблемы",
				},
			],
			justButtonComponents({
				label: "Открыть модальное окно отправки",
				customId: "askReportText",
			}),
		]);
		_interface.updateMessage();
		_interface.emitter.on(
			MessageInterface.Events.allowed_collect,
			({ interaction }) => {
				switch (interaction.customId) {
					case "askReportText":
						return this.askreportText(interaction);
					case "setImportance":
						this.importanceStatus = Importances.at(+interaction.values[0]);
						interaction.msg({
							content: "Статус важности проблемы установлен",
							ephemeral: true,
							fetchReply: true,
							delete: 2 * SECOND,
						});
						return;
				}
			},
		);
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
	componentsCallbacks = {
		update_error_message_status,
	};
	options = {
		name: "bug",
		id: 2,
		media: {
			description: "Структурируйте информацию об ошибках, отправляйте запросы",
			example: `!bug например, команда эмбеды при использовании сразу говорит, что они не найдены, хотя в канале есть`,
		},
		alias: "баг",
		allowDM: true,
		cooldown: 10 * SECOND,
		cooldownTry: 3,
		type: "dev",
		cliParser: {
			flags: [],
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
