import { PermissionsBits } from "#src/discord/permissions.js";
import { take_missing_permissions } from "#src/discord/utils.js";

export function filterChat(msg) {
	let content = msg.content;
	content = content.replace(/\\/g, "");

	const abuse = [
		"хуйло",
		"пидорас",
		"шалава",
		"безмамный",
		"nigga",
		"чмо",
		"уёбок",
		"гнида",
		"анал",
		"блядь",
		"импотент",
		"обосанный",
		"залупа",
		"обосранный",
		"пиздабол",
		"хуйня",
		"разъебись",
		"suck",
		"bitch",
		"slave",
		"пендос",
		"членосос",
		"педик",
		"дилдо",
		"лох",
		"конченный",
		"конч",
		"конченый",
		"пидор",
		"пидр",
		"хуесос",
		"блять",
		"сука",
		"сучка",
		"сучара",
		"нахуй",
		"хуй",
		"жопа",
		"говно",
		"ебать",
		"дебик",
		"нах",
		"бля",
		"идиот",
		"далбаёб",
		"долбоеб",
		"долбаеб",
		"долбоёб",
		"даун",
		"шлюха",
		"клоун",
		"fuck",
		"fucking",
	];
	if (
		content
			.toLowerCase()
			.split(" ")
			.some((e) => abuse.includes(e))
	) {
		if (msg.channel.nsfw === true) {
			return false;
		}

		msg.delete();
		abuse.forEach((word) => {
			msg.content = msg.content.replace(
				RegExp(`(?<=${word[0]})${word.slice(1)}`, "gi"),
				(e) => "#".repeat(e.length),
			);
		});

		msg.author.msg({
			title: "Ваше сообщение содержит нецензурную лексику!",
			description: `Текст сообщения: ${msg.content}`,
		});
		msg.guild.logSend({
			title: "Удалено сообщение с ненормативным содержанием",
			description: `Текст: ${msg.content}`,
			author: { name: msg.author.username, iconURL: msg.author.avatarURL() },
		});
		return true;
	}

	const capsLenght = content
		.split("")
		.filter((symbol) => symbol.toLowerCase() !== symbol).length;
	if (capsLenght > 4 && capsLenght / content.length > 0.5) {
		const isAdmin =
			msg.guild &&
			take_missing_permissions(
				msg.guild.members.resolve(msg.author),
				PermissionsBits.Administrator,
			).length === 0;

		if (isAdmin) {
			return false;
		}

		msg.delete();
		msg.author.msg({
			title: "Ваше сообщение содержит CAPS-LOCK!",
			description: `Текст сообщения: ${msg.content}`,
		});
		msg.guild.logSend({
			title: "Удалено сообщение с большим содержанием КАПСА",
			description: `Текст: ${msg.content}`,
			author: { name: msg.author.username, iconURL: msg.author.avatarURL() },
		});
		return true;
	}
}
