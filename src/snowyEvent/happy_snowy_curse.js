import { inMessageSpamLimit } from "#src/chat_filter.js/inSpamSystem.js";
import { addCoinFromMessage } from "#src/coin_message/requestCoinFromMessage.js";
import { CurseManager } from "#src/curses/CurseManager/singleton/index.js";
import { random } from "#src/safe-utils.js";
import { component_actions } from "#src/snowyEvent/components/mod.js";
import { onPresentsChatInputCommand } from "#src/snowyEvent/onPresentsChatInputCommand.js";

export const happySnowyCurse = {
	_weight: 0,
	id: "happySnowy",
	hard: 2,
	description:
		"Собирайте снежинки: и открывайте !сумка использовать подарок, с наступающим",
	values: {
		timer: () => {
			const now = new Date();
			const tomorrow = new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate() + 1,
			).getTime();
			return Math.floor(tomorrow - now.getTime());
		},
		progress: () => 0,
	},
	async onComponent({ params, interaction }) {
		const [target, ...parsed] = params;

		component_actions[target].call(this, {
			params: parsed,
			interaction,
		});
	},
	callback: {
		coinFromMessage(user, curse) {
			CurseManager.interface({ user, curse }).incrementProgress(
				random(1, 4) * 5,
			);
		},
		messageCreate(user, curse, message) {
			if (inMessageSpamLimit(user)) {
				return;
			}
			if (random(20) === 0) {
				addCoinFromMessage(message);
			}
		},
		async inputCommandParsed(user, curse, context) {
			const { commandBase } = context;
			const targetKeywords = new Map(
				[
					"present",
					"presents",
					"подарок",
					"подарки",
					"подарунок",
					"подарунки",
				].map((key) => [key, true]),
			);

			if (!targetKeywords.has(commandBase)) {
				return;
			}

			return onPresentsChatInputCommand(user, curse, context);
		},
		curseTimeEnd(user, curse, target) {
			if (curse !== target.curse) {
				return;
			}

			curse.values["h0-h0-h0"] = "❤️‍🔥";
			CurseManager.interface({ user, curse }).success();
			target.preventDefault();
		},
	},
	reward: 3,
	filter: () => false,
};
