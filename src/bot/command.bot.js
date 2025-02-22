import config from "#config";

import { client } from "#src/bot/client/singleton.js";
import { DataManager } from "#src/data/singleton.js";
import { Pager } from "#src/discord/Pager.js";
import ErrorsHandler from "#src/ErrorsHandler/ErrorsHandler.js";

import { DAY } from "#constants/time.js";
import {
	change_to_string,
	group_changes_by_default,
} from "#src/changelog/ChangelogDaemon/display.js";
import { metadata } from "#src/changelog/ChangelogDaemon/metadata.js";
import {
	BaseCommand,
	BaseFlagSubcommand,
} from "#src/commands/BaseCommand/BaseCommand.js";
import { flag } from "#src/commands/BaseCommand/parse_flags.js";
import { BaseCommandRunContext } from "#src/commands/CommandRunContext.js";
import CommandsManager from "#src/commands/CommandsManager/singleton.js";
import dayjs from "#src/dayjs.js";
import { pushMessage } from "#src/discord/pushMessage.js";
import {
	disable_caller_component,
	generateInviteFor,
} from "#src/discord/utils.js";
import { version } from "#src/enviroment.js";
import { fetchFromInnerApi } from "#src/http_requests/fetchFromInnerApi.js";
import { getAddress } from "#src/http_requests/util.js";
import { sortByResolve } from "#src/mini.js";
import {
	chunkBySize,
	clone,
	multiline,
	season_of_month,
	timestampToDate,
} from "#src/safe-utils.js";
import { CliParser } from "@zoodogood/utils/CliParser";
import { createModal } from "@zoodogood/utils/discordjs";
import { ending } from "@zoodogood/utils/primitives";
import { ButtonStyle, ComponentType, TextInputStyle } from "discord.js";
import { singleton } from "../changelog/ChangelogDaemon/singleton.js";

function website_get_useful_links() {
	const { origin } = config.server;
	return [
		{
			label: "Главная",
			href: `${origin}/pages/navigation`,
		},
		{
			label: "Страница ошибок",
			href: `${origin}/pages/errors/list`,
		},
		{
			label: "Список изменений",
			href: `${origin}/pages/modules/changelog/`,
		},
		{
			label: "Аудит ресурсов",
			href: `${origin}/pages/info/audit/resources`,
		},
	];
}

class TimeEvents_FlagSubcommand extends BaseFlagSubcommand {
	static FLAG_DATA = flag(["--time-events"], "Активные события");
	pager = new Pager();
	async onProcess() {
		const { context } = this;
		const { timeEvents_singleton: timeEvents } = await import(
			"#src/events/time/timeEvents_singleton.js"
		);

		const days = timeEvents.getExistsDaysList() || [];
		const events = Object.entries(
			Object.groupBy(
				days
					.map((day) => timeEvents.at(day))
					.reduce((acc, events) => acc.concat(events), []),
				(event) => event.name,
			),
		).map(([name, events]) => ({
			count: events.length,
			name,
			first: events.reduce(
				(min, event) => Math.min(min, event.timestamp),
				Infinity,
			),
			last: events.reduce((max, event) => Math.max(max, event.timestamp), 0),
		}));

		const { pager } = this;
		pager.setChannel(context.interaction.channel);
		pager.addPages(
			{
				description: multiline([
					`Карта событий с ${dayjs(+days[0] * DAY).format("DD.MM.YYYY")} по ${dayjs(+days[days.length - 1] * DAY).format("DD.MM.YYYY")}\n\n`,
					...events.map(({ name }, i) => `${i + 1}. ${name}\n`),
				]),
			},
			...events.map((info) => ({
				description: multiline([
					"{\n\n",
					`ㅤИмя события: ${info.name}\n`,
					`ㅤКоличество: ${info.count}\n`,
					`ㅤПервое: ${dayjs(info.first).format("DD.MM HH:mm")}\n`,
					info.last !== info.first &&
						`ㅤПоследнее: ${dayjs(info.last).format("DD.MM HH:mm")}\n`,
					"\n}",
				]),
			})),
		);
		pager.updateMessage();
	}
}

class Invite_FlagSubcommand extends BaseFlagSubcommand {
	static FLAG_DATA = {
		name: "--invite",
		capture: ["--invite"],
	};
	async onProcess() {
		const { context } = this;
		const link = generateInviteFor(client);
		const content = `[Пригласить: discord.com/oauth2/authorize?client_id=${client.user.id}](${link})`;
		context.interaction.msg({
			content,
		});
	}
}
class Node_FlagSubcommand extends BaseFlagSubcommand {
	static FLAG_DATA = {
		name: "--node",
		capture: ["--node"],
	};
	async onProcess() {
		const { context } = this;
		const version = process.version;
		const content = `Node js: ${version} [${process.arch}]`;
		context.interaction.msg({
			content,
		});
	}
}
class Website_FlagSubcommand extends BaseFlagSubcommand {
	static FLAG_DATA = {
		name: "--website",
		capture: ["--website"],
	};
	async onProcess() {
		const status = await fetchFromInnerApi("toys/ping", { parseType: "text" });
		const contents = {
			status: `Статус сервера: ${status}, — проверяет доступность домена.`,
			links: `Полезные сссылки:\n${website_get_useful_links()
				.map(({ label, href }) => `- [${label}](${href})`)
				.join("\n")}`,
		};
		const description = `${contents.status}\n\n${contents.links}`;

		this.context.interaction.msg({
			description,
		});
	}
}
class Errors_FlagSubcommand extends BaseFlagSubcommand {
	static FLAG_DATA = {
		name: "--errors",
		capture: ["--errors"],
	};
	async onProcess() {
		(await CommandsManager.commandInstance("bug")).onChatInput(
			null,
			Object.assign(clone(this.context.interaction), { params: "--errors" }),
		);
	}
}

class Changelog_FlagSubcommand extends BaseFlagSubcommand {
	static FLAG_DATA = {
		name: "--changelog",
		capture: ["--changelog"],
	};
	getEmbed(groups, pager) {
		const { currentPage } = pager;
		const [period, bySymbol] = groups[currentPage];
		const description = bySymbol
			.map(
				([group_base, changes]) =>
					`${group_base.label}:\n${changes.map(change_to_string).join("\n")}`,
			)
			.join("\n\n");

		return {
			title: `Список изменений за ${period}`,
			description,
		};
	}

	async onProcess() {
		const { context } = this;

		const groups = group_changes_by_default(singleton.data.map(metadata));
		const pager = new Pager();
		pager.setPagesLength(groups.length);
		pager.setChannel(context.interaction.channel);
		pager.setRender(() => this.getEmbed(groups, pager));
		pager.updateMessage();
	}
}

class CommandRunContext extends BaseCommandRunContext {
	parseCli(input) {
		const parsed = new CliParser()
			.setText(input)
			.captureFlags(this.command.options.cliParser.flags)
			.collect();

		const values = parsed.resolveValues((capture) => capture?.toString());
		this.setCliParsed(parsed, values);
		return parsed;
	}
}

class CommandDefaultBehaviour extends BaseFlagSubcommand {
	static async commandsUsedContent() {
		const list = await Promise.all(
			sortByResolve(
				Object.entries(DataManager.data.bot.commandsUsed),
				($) => $[1],
				{ reverse: true },
			).map(
				async ([id, uses], i) =>
					`${String(i + 1) + ".".repeat(2 - String(i + 1).length)}.${
						(await CommandsManager.commandInstance(id)).options.name
					}_${uses}(${+(
						(uses / DataManager.data.bot.commandsLaunched) *
						100
					).toFixed(2)})%`,
			),
		);
		const greatest_cell_size = Math.max(...list.map((stroke) => stroke.length));
		const lines = list.map(
			(stroke) =>
				`${stroke} ${" ".repeat(greatest_cell_size + 7 - stroke.length)}`,
		);

		return multiline([
			"```js\n",
			"Тут такое было.. ого-го\n",
			"ᅠ\n",
			// plain_of_lines ↴
			chunkBySize(lines, 2).reduce(
				(acc, cells) => (acc += `${cells.join(" ")}\n`),
				"",
			),
			"\nᅠ\n",
			"```",
		]);
	}
	static getMainInterfaceComponents() {
		const components = [
			{
				type: ComponentType.Button,
				label: "Больше",
				style: ButtonStyle.Success,
				customId: "@command/bot/getMoreInfo",
			},
			{
				type: ComponentType.Button,
				label: "Сервер",
				style: ButtonStyle.Link,
				url: config.guild.url,
				emoji: { name: "grempen", id: "753287402101014649" },
			},
			{
				type: ComponentType.Button,
				label: "Пригласить",
				style: ButtonStyle.Link,
				url: generateInviteFor(client),
				emoji: { name: "berry", id: "756114492055617558" },
			},
		];
		return components;
	}

	async onProcess() {
		const { interaction } = this.context;
		const { rss, heapTotal } = process.memoryUsage();
		const { server_singleton } = await import(
			"#src/http_requests/server_singleton.js"
		);
		const address = getAddress(server_singleton);

		const season = ["Зима", "Весна", "Лето", "Осень"][
			season_of_month(new Date().getMonth() + 1)
		];

		const contents = {
			ping: `<:online:637544335037956096> Пинг: ${client.ws.ping}`,
			version: `V${version ?? "0.0.0"}`,
			season: `[#${season}](https://hytale.com/supersecretpage)`,
			guilds: `Серваков...**${client.guilds.cache.size}**`,
			commands: `Команд: ${CommandsManager.collection.size}`,
			time: `Время сервера: ${new Intl.DateTimeFormat("ru-ru", {
				hour: "2-digit",
				minute: "2-digit",
			}).format()}`,
			address: address ? `; Доступен по адрессу: ${address}` : "",
			performance: `\`${(heapTotal / 1024 / 1024).toFixed(2)} мб / ${(
				rss /
				1024 /
				1024
			).toFixed(2)} МБ\``,

			errors: `Паник за текущий сеанс: ${Number(
				ErrorsHandler.actualSessionMetadata().errorsCount,
			)}`,
			uniqueErrors: `Уникальных паник: ${
				ErrorsHandler.actualSessionMetadata().uniqueErrors.size
			}`,
		};

		const embed = {
			title: "ну типа.. ай, да, я живой, да",
			description: `${contents.ping} ${contents.version} ${contents.season}, что сюда ещё запихнуть?\n${contents.guilds}(?) ${contents.commands}\n${contents.performance}\n${contents.time}${contents.address}\n${contents.errors};\n${contents.uniqueErrors}`,
			footer: {
				text: `Укушу! Прошло времени с момента добавления бота на новый сервер: ${
					DataManager.data.bot.addToNewGuildAt
						? timestampToDate(
								Date.now() - DataManager.data.bot.addToNewGuildAt,
								2,
							)
						: "Вечность"
				}`,
			},
			components: CommandDefaultBehaviour.getMainInterfaceComponents(),
		};

		interaction.channel.msg(embed);
	}
}

const AddableFunctionsInterface = {
	components: {
		removeThisInterface: {
			type: ComponentType.Button,
			label: "Удалить!",
			style: ButtonStyle.Primary,
			customId: "@command/bot/removeThisInterface",
		},
		postReview: {
			type: ComponentType.Button,
			label: "Быстрая связь",
			style: ButtonStyle.Primary,
			customId: "@command/bot/postReview",
		},
		getUptime: {
			type: ComponentType.Button,
			label: "Аптайм",
			style: ButtonStyle.Secondary,
			customId: "@command/bot/getUptime",
		},
		commands: {
			type: ComponentType.Button,
			label: "Команды",
			style: ButtonStyle.Secondary,
			customId: "@command/bot/commands",
		},
	},
};
class Command extends BaseCommand {
	componentsCallbacks = {
		removeThisInterface({ interaction }) {
			interaction.message.delete();

			interaction.msg({
				title: "Сообщение удалено",
				description:
					"Зачем удалено, почему удалено, что было бы если бы вы не удалили это сообщение, имело ли это какой-нибудь скрытый смысл...?",
				author: {
					name: interaction.member.user.username,
					iconURL: interaction.user.avatarURL(),
				},
			});
			return;
		},
		async getMoreInfo({ interaction }) {
			pushMessage(interaction, {
				components: Object.values(AddableFunctionsInterface.components),
			});
			disable_caller_component(
				{
					components: CommandDefaultBehaviour.getMainInterfaceComponents(),
				},
				interaction,
			);
		},
		getUptime({ interaction }) {
			const ms = process.uptime() * 1_000;
			const formatted = dayjs
				.duration(ms)
				.format("DD д., HH ч. : mm м. : ss с.");

			const content = `Аптайм: [${formatted}], — бот запущен и работал без перезапусков именно столько.`;
			interaction.msg({ content, delete: 15_000 });
		},
		async commands({ interaction }) {
			disable_caller_component(
				{
					components: Object.values(AddableFunctionsInterface.components).map(
						clone,
					),
				},
				interaction,
			);
			pushMessage(interaction, {
				content: await CommandDefaultBehaviour.commandsUsedContent(),
				maySplitMessage: {
					separateBy: "\n",
				},
			});
		},
		postReview({ interaction }) {
			const components = [
				{
					type: ComponentType.TextInput,
					customId: "content",
					style: TextInputStyle.Paragraph,
					label: "Введите вопрос, отзыв или веселую шутку",
					maxLength: 2000,
				},
			];

			const modal = createModal({
				components,
				customId: "@command/bot/postReviewModal",
				title: "Отправить",
			});

			interaction.showModal(modal);
			return;
		},
		postReviewModal({ interaction }) {
			const description = interaction.fields.getField("content").value;
			const { user } = interaction;

			const embed = {
				author: {
					iconURL: client.user.avatarURL(),
					name: `Получен отзыв из сервера с ${ending(
						interaction.guild ? interaction.guild.memberCount : 0,
						"участник",
						"ами",
						"ом",
						"ами",
					)}\nСодержимое:`,
				},
				description,
				footer: { text: `${user.tag} | ${user.id}`, iconURL: user.avatarURL() },
				components: [
					{
						type: ComponentType.Button,
						label: "Ответить",
						customId: `@command/bot/answerForReview:${user.id}`,
						style: ButtonStyle.Success,
					},
				],
			};

			config.developers?.forEach((id) => {
				const user = client.users.cache.get(id);
				user?.msg(embed);
			});

			interaction.msg({
				ephemeral: true,
				content: "Спасибо!",
			});
		},
		answerForReview({ interaction, params }) {
			const [id] = params;
			const user = client.users.cache.get(id);
			if (!user) {
				interaction.msg({
					ephemeral: true,
					color: "#ff0000",
					description: "Неудалось найти пользователя",
				});
				return;
			}

			const components = [
				{
					type: ComponentType.TextInput,
					customId: "content",
					style: TextInputStyle.Paragraph,
					label: "Если что вдруг",
					placeholder: "По пятницам я не отвечаю",
					maxLength: 2000,
				},
			];

			const modal = createModal({
				components,
				customId: `@command/bot/answerForReviewModal:${id}`,
				title: `Ответ ${user.username}'у`,
			});

			interaction.showModal(modal);
			return;
		},
		async answerForReviewModal({ interaction, params }) {
			const [id] = params;
			const description = interaction.fields.getField("content").value;
			const user = client.users.cache.get(id);

			const embed = {
				author: {
					iconURL: interaction.user.avatarURL(),
					name: "Получен ответ на ваше сообщение",
				},
				description,
				color: "#6534bf",
				footer: {
					text: `Ответ предоставил ${interaction.user.tag}. Если вы хотите отреагировать, свяжитесь напрямую с пользователем, ответившим вам`,
				},
				image:
					"https://media.discordapp.net/attachments/629546680840093696/1073849735850508339/simple-black-rounded-line.png?width=559&height=559",
			};

			const message = await user.msg(embed);

			Object.assign(embed, {
				reference: message.id,
				description: `<t:${Math.floor(
					interaction.message.createdTimestamp / 1_000,
				)}>\n>>> ${interaction.message.embeds.at(0).description}`,
				author: {
					name: "Содержимое вашего сообщения:",
					iconURL: user.avatarURL(),
				},
				color: "#3260a8",
				footer: null,
				components: [
					{
						type: ComponentType.Button,
						label: "Спрятать",
						style: ButtonStyle.Secondary,
						customId: "@command/bot/hideMessage",
					},
				],
			});

			await user.msg(embed);

			interaction.msg({
				ephemeral: true,
				content: "Ваш ответ дошёл до пользователя!",
			});
		},
		hideMessage({ interaction }) {
			interaction.message.delete();
			interaction.msg({
				ephemeral: true,
				content:
					"Совет: используйте команду !клир, чтобы очистить ненужные сообщения в этом чате",
			});
			return;
		},
	};
	options = {
		name: "bot",
		id: 15,
		media: {
			description:
				"Показывает интересную информацию о боте. Именно здесь находится ссылка для приглашения его на сервер.",
			example: `!bot #без аргументов`,
		},
		cliParser: {
			flags: [
				Invite_FlagSubcommand.FLAG_DATA,
				Node_FlagSubcommand.FLAG_DATA,
				Website_FlagSubcommand.FLAG_DATA,
				Errors_FlagSubcommand.FLAG_DATA,
				Changelog_FlagSubcommand.FLAG_DATA,
				TimeEvents_FlagSubcommand.FLAG_DATA,
			],
		},
		accessibility: {
			publicized_on_level: 7,
		},
		alias: "бот stats статс ping пинг стата invite пригласить",
		allowDM: true,
		cooldown: 10_000,
		type: "bot",
	};

	async onChatInput(msg, interaction) {
		const context = await CommandRunContext.new(interaction, this);
		context.setWhenRunExecuted(this.run(context));
		return context;
	}
	async processChangelogSubcommand(context) {
		const value = context.cliParsed.at(1).get("--changelog");
		if (!value) {
			return false;
		}
		await new Changelog_FlagSubcommand(context, value).onProcess();
		return true;
	}
	async processErrorsSubcommand(context) {
		const value = context.cliParsed.at(1).get("--errors");
		if (!value) {
			return false;
		}
		await new Errors_FlagSubcommand(context, value).onProcess();
		return true;
	}
	async processInviteSubcommand(context) {
		const value = context.cliParsed.at(1).get("--invite");
		if (!value) {
			return false;
		}
		await new Invite_FlagSubcommand(context, value).onProcess();
		return true;
	}
	async processNodeSubcommand(context) {
		const value = context.cliParsed.at(1).get("--node");
		if (!value) {
			return false;
		}
		await new Node_FlagSubcommand(context, value).onProcess();
		return true;
	}
	async processTimeEventsSubcommand(context) {
		const value = context.cliParsed.at(1).get("--time-events");
		if (!value) {
			return false;
		}
		await new TimeEvents_FlagSubcommand(context, value).onProcess();
		return true;
	}

	async processWebsiteSubcommand(context) {
		const value = context.cliParsed.at(1).get("--website");
		if (!value) {
			return false;
		}
		await new Website_FlagSubcommand(context, value).onProcess();
		return true;
	}

	async run(context) {
		context.parseCli(context.interaction.params);
		if (await this.processInviteSubcommand(context)) {
			return;
		}
		if (await this.processNodeSubcommand(context)) {
			return;
		}
		if (await this.processWebsiteSubcommand(context)) {
			return;
		}
		if (await this.processErrorsSubcommand(context)) {
			return;
		}
		if (await this.processChangelogSubcommand(context)) {
			return;
		}
		if (await this.processTimeEventsSubcommand(context)) {
			return;
		}
		await new CommandDefaultBehaviour(context).onProcess();
	}
}

export default Command;
