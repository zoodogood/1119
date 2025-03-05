import { MINUTE } from "#constants/time.js";
import client from "#src/bot/client/singleton.js";
import { _pushMessage } from "#src/discord/pushMessage.js";
import { onMessageDelete as ChainLifeCycleOnMessageDelete } from "@zoodogood/utils/discordjs";
import Discord from "discord.js";

// MARK: Prototypes
// =================================================

// MARK: Discord
Discord.User.prototype.msg = _pushMessage;
Discord.Message.prototype.msg = _pushMessage;
Discord.BaseChannel.prototype.msg = _pushMessage;
Discord.Webhook.prototype.msg = _pushMessage;
Discord.WebhookClient.prototype.msg = _pushMessage;
Discord.BaseInteraction.prototype.msg = _pushMessage;
Discord.InteractionResponse.prototype.msg = _pushMessage;

Discord.Message.prototype.awaitReact = async function (options, ...reactions) {
	if (!options.user) {
		throw new Error("without user");
	}
	reactions = reactions.filter((reaction) => reaction);

	if (!reactions.length) {
		return false;
	}

	const filter = (reaction, member) => {
		const allowReaction = reactions.includes(
			reaction.emoji.id ?? reaction.emoji.name,
		);
		const allowUser =
			options.user === "any"
				? member.id !== client.user.id
				: member.id === options.user.id;
		return allowUser && allowReaction;
	};

	let collected = this.awaitReactions({
		filter,
		max: 1,
		time: options.time ?? MINUTE * 5,
	}).then((reaction) => (collected = reaction));

	for (let i = 0; i < reactions.length; i++) {
		if (collected instanceof Promise === false) {
			if (options.removeType === "all") {
				break;
			}
		}
		this.react(reactions[i]);
	}

	collected = await collected;
	const reaction = collected.first();

	if (!reaction) {
		this.reactions.cache
			.filter((reaction) => reaction.me)
			.each((reaction) => reaction.remove());
		return false;
	}

	if (options.removeType === "all") this.reactions.removeAll().catch(() => {});
	if (options.removeType === "one")
		reaction.users.remove(options.user).catch(() => {});
	if (options.removeType === "full") reaction.remove().catch(() => {});

	return reaction.emoji.id ?? reaction.emoji.name;
};

Discord.BaseChannel.prototype.awaitMessage = async function (options) {
	const user = options.user;

	const filter = (message) =>
		(!user && !message.author.bot) || message.author.id === user.id;
	const collected = await this.awaitMessages({
		filter,
		max: 1,
		time: options.time || MINUTE * 5,
	});

	const input = collected.first();
	if (input && options.remove) {
		ChainLifeCycleOnMessageDelete(input);
		input.delete();
	}
	return input;
};

Discord.Guild.prototype.Audit = async function (
	find = false,
	{ limit = 3, before = null, user = null, type = null },
) {
	const audit = await this.fetchAuditLogs({ limit, before, user, type }).catch(
		() => {},
	);

	if (!audit) {
		return null;
	}
	const auditLog = find ? audit.entries.find(find) : audit.entries.first();
	return auditLog;
};

Object.defineProperty(Discord.Message.prototype, "embed", {
	get() {
		const { embeds } = this;
		const [embed] = embeds || [];
		return embed;
	},
});

// MARK: JavaScript

Array.prototype.random = function ({ pop, weights } = {}) {
	let index;
	if (weights) {
		let previousLimit = 0;
		const thresholds = this.map((element, i) => {
			if (isNaN(element._weight)) {
				throw new Error(
					`Element at index ${i} returns NaN _weigth. Value: ${element._weight}`,
				);
			}
			return (previousLimit = element._weight + previousLimit);
		});

		const line = Math.random() * thresholds.at(-1);
		index = thresholds.findIndex((threshold) => threshold >= line);
	} else index = Math.floor(Math.random() * this.length);

	const input = this[index];
	if (pop) this.splice(index, 1);
	return input;
};

Array.prototype.remove = function (element) {
	throw new Error("Replace array.remove(item) to arraySpliceItem(array, item)");
	const index = this.indexOf(element);
	if (index === -1) {
		return false;
	}
	this.splice(index, 1);
	return true;
};

BigInt.prototype.toJSON = function () {
	return this.toString();
};

Set.prototype.toJSON = function () {
	return [...this.values()];
};

Map.prototype.toJSON = function () {
	return [...this.entries()];
};

Object.defineProperty(Discord.User.prototype, "guilds", {
	get() {
		const guilds = client.guilds.cache.filter((guild) =>
			guild.members.cache.get(this.id),
		);
		return [...guilds.values()];
	},
	enumerable: false,
});
