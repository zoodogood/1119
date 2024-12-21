import { SECOND } from "#constants/time.js";
import { BaseCommand } from "#src/commands/BaseCommand/BaseCommand.js";
import { sleep } from "#src/safe-utils.js";

class Command extends BaseCommand {
	options = {
		name: "localization",
		id: 64,
		media: {
			description: "Помощь с переводом",
		},
		accessibility: {
			publicized_on_level: 10,
		},
		alias: "локализация локалізація i18n",
		allowDM: true,
		cooldown: 4_000,
		hidden: true,
		type: "other",
	};

	async onChatInput(msg, interaction) {
		interaction.message.delete();
		throw new Error("Test error");
		const ALPHABET_A_CODE = 97;
		const description =
			import.meta.resolve("#src/i18n/en.yaml") +
			"\nэта вне код блока\n```\naaaa\n```\naaa\n```md\n" +
			Array.from(
				new Array(8),
				(_, i) => `${String.fromCharCode(i + ALPHABET_A_CODE).repeat(1000)}\n`,
			).join("") +
			"\n```" +
			" а эта часть должна оказаться вне код блока";
		const message = await interaction.msg({
			maySplitMessage: {
				separateBy: "\n",
			},
			footer: { text: "i18n is not defined" },
			content: description,
		});
		await sleep(3 * SECOND);
		// message.msg({
		// 	maySplitMessage: {
		// 		separateBy: "\n",
		// 	},
		// 	description: "Ла-ла-ла",
		// 	edit: true,
		// });
		// Promise.reject(new Error("Resource not yet loaded!"));
		// throw new Error("i18n is not defined");
	}
}

export default Command;
