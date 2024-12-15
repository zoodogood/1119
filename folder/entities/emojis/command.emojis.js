import { BaseCommand } from "#lib/BaseCommand.js";
import * as Util from "#lib/util.js";
import { client } from "#bot/client.js";

class Command extends BaseCommand {
	options = {
		name: "emojis",
		id: 23,
		media: {
			description:
				"Отправляет список смайликов на сервере или подробную информацию об одном из них.",
			example: `!emojis <emoji|emojiID>`,
		},
		alias: "emoji смайлики эмодзи эмоджи емодзі",
		allowDM: true,
		cooldown: 7_000,
		type: "other",
	};

	async onChatInput(msg, interaction) {
		if (interaction.params) {
			const id = Util.match(interaction.params, /\d{17,21}/);
			const emoji = id
				? client.emojis.cache.get(id)
				: interaction.guild.emojis.cache.find(
						(emoji) =>
							emoji.name.toLowerCase() === interaction.params.toLowerCase(),
					);

			if (!emoji) {
				msg.msg({
					title: "Попробуйте ещё раз",
					description: `Указатель: "\`${interaction.params}\`" — был произведён безуспешный поиск по айди и имени.\nЧтобы получить список эмодзи на сервере введите команду без аргументов.\nВведя идентификатор смайлика, получите более подробную информацию о нём`,
					color: "#ff0000",
					delete: 20_000,
				});
				return;
			}

			const author = await emoji.fetchAuthor();
			const fields = [
				{ name: "Имя:", value: "`" + emoji.name + "`", inline: true },
				{ name: "Эмодзи добавил:", value: author.tag, inline: true },
				{
					name: "Был добавлен на сервер: ",
					value:
						Util.timestampToDate(Date.now() - emoji.createdTimestamp, 4) +
						" назад.",
				},
			];
			msg.msg({
				title: "О нём:",
				description: `> ${emoji.toString()}`,
				thumbnail: emoji.imageURL(),
				author: {
					name: `Эмотикон :>\nС сервера ${emoji.guild.name}`,
					iconURL: emoji.guild.iconURL(),
				},
				footer: { text: `ID: ${emoji.id}` },
				fields,
			});
			return;
		}

		const emojis = msg.guild.emojis.cache
			.sort(
				(a, b) =>
					b.animated - a.animated ||
					(b.name > a.name ? -1 : b.name < a.name ? 1 : 0),
			)
			.map((e) => e.toString() + "  " + e.id);

		const pages = [];
		let page = 0;
		while (emojis.length) pages.push(emojis.splice(0, 20));
		if (!pages[0]) {
			return msg.msg({
				title: "<a:google:638650010019430441> Эмотиконы сервера!",
				description: "Но тут почему-то пусто... 🐘",
			});
		}

		const embed = {
			title: "<a:google:638650010019430441> Эмотиконы!!",
			description: pages[page].join("\n"),
			thumbnail: msg.guild.emojis.cache.random().url,
		};
		if (pages[1])
			embed.footer = { text: `Страница: ${page + 1} / ${pages.length}` };

		let message = await msg.msg(embed);

		let react = await message.awaitReact(
			{ user: msg.author, removeType: "all" },
			pages[1] ? "640449832799961088" : null,
		);
		embed.edit = true;

		while (true) {
			switch (react) {
				case "640449832799961088":
					page++;
					break;
				case "640449848050712587":
					page--;
					break;
				default:
					return;
			}

			embed.footer = { text: `Страница: ${page + 1} / ${pages.length}` };
			embed.description = pages[page].join("\n");

			embed.thumbnail = msg.guild.emojis.cache.random().url;
			message = await message.msg(embed);
			react = await message.awaitReact(
				{ user: msg.author, removeType: "all" },
				page !== 0 ? "640449848050712587" : null,
				page + 1 !== pages.length ? "640449832799961088" : null,
			);
		}
	}
}

export default Command;
