import { PermissionsBits } from "#constants/enums/discord/permissions.js";
import { HOUR } from "#constants/globals/time.js";
import { BaseCommand } from "#lib/BaseCommand.js";
import Discord from "discord.js";

class Command extends BaseCommand {
	options = {
		name: "archive",
		id: 10,
		media: {
			description:
				"Архивирует сообщения в канале и отправляет содержимое пользователю в виде файла.",
			example: `!archive #без аргументов`,
		},
		alias: "arhive архив архів",
		allowDM: true,
		cooldown: HOUR,
		type: "delete",
		userPermissions: PermissionsBits.ManageChannels,
	};

	async onChatInput(msg, interaction) {
		const channel = msg.channel,
			sum_messages = [],
			options = { limit: 100 },
			date = new Date();
		let last_id,
			time = 0;

		while (true) {
			if (last_id) options.before = last_id;
			const messages = await channel.messages.fetch(options, false);
			sum_messages.push(...messages.values());
			last_id = messages.last().id;
			if (messages.size !== 100) break;
			if (++time === 20)
				msg.msg({ title: "Нужно немного подождать", delete: 3000 });
			if (++time === 50) msg.msg({ title: "Ждите", delete: 3000 });
		}

		let input = date + "\n\n",
			last;
		sum_messages.reverse().forEach((item) => {
			if (!last || last.author.tag !== item.author.tag) {
				const date = new Date(item.createdTimestamp);
				input +=
					"\n    ---" +
					item.author.tag +
					" " +
					date.getHours() +
					":" +
					date.getMinutes() +
					"\n";
			}
			input += item.content + "\n";
			last = item;
		});

		const buffer = Buffer.from(input.replace("undefined", ""), "utf-8");

		msg.msg({
			title: new Discord.MessageAttachment(
				buffer,
				(interaction.params || "archive") + ".txt",
			),
			embed: true,
		});
		if (time > 35) msg.msg({ title: "Вот ваша печенька ожидания 🍪" });
	}
}

export default Command;
