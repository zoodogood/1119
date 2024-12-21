import { SECOND } from "#constants/time.js";
import { assert } from "#src/assert/export.js";
import { PropertiesEnum } from "#src/data/Properties.js";
import { addResource } from "#src/data/public/addResource.js";
import { question } from "#src/discord/utils.js";
import { Emoji } from "#src/emojis/emojis.js";
import { percent_string } from "#src/formatters/formatters.js";
import { ending } from "@zoodogood/utils/primitives";

export class BankInteraction {
	constructor(context, source) {
		this.context = context;
		this.source = source;
		this.guild = context.guild;
		this.executor = context.executor;
		this.channel = context.channel;
	}
	bankCoins() {
		return this.guild.data.coins;
	}
	requestGetFromBank(value, message) {
		if (this.bankCoins() < value) {
			throw new Error("Not enough coins");
		}
		const { executor, guild, context } = this;
		assert(executor);

		guild.data.coins -= value;
		context.channel.msg({
			author: {
				key: executor.username,
				iconURL: executor.avatarURL(),
			},
			description: `Вам начислено ${value} ${Emoji.coins}! ${message}`,
		});

		addResource({
			resource: PropertiesEnum.coins,
			user: this.executor,
			value,
			executor,
			context,
			source: "BankInteraction.requestGetFromBank",
		});
		return true;
	}
	async requestPayToBank(value, prompt) {
		const { channel, executor, guild, source, context } = this;
		const { emoji } = await question({
			channel,
			user: executor,
			message: {
				author: {
					key: executor.username,
					iconURL: executor.avatarURL(),
				},
				description: `Сделка: ${prompt}. Основана пользователем ${source.empowered}.\n\nВнести в казну ${ending(value, "коин", "ов", "", "а")} ${Emoji.coins} ?`,
				footer: {
					text: `У вас ${ending(executor.data.coins, "коин", "ов", "", "а")}${executor.data.coins < value ? ` (${percent_string(executor.data.coins / value)} от требуемого)` : ""}`,
				},
			},
			messageOptions: {
				disable: true,
			},
			reactions: [executor.data.coins > value && "✅", "❌"],
		});
		if (emoji === "❌") {
			context.channel.msg({ title: "Отклонено", delete: SECOND * 8 });
			return null;
		}
		if (emoji !== "✅") {
			return null;
		}
		guild.data.coins += value;
		addResource({
			resource: PropertiesEnum.coins,
			user: executor,
			value: -value,
			executor,
			context,
			source: "BankInteraction.requestPayToBank",
		});
		return true;
	}
}
