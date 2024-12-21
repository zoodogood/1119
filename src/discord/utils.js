import { MINUTE } from "#constants/time.js";
import { _pushMessage, pushMessage } from "#src/discord/pushMessage.js";
import {
	codeOfEmoji,
	createModal,
	justButtonComponents,
} from "@zoodogood/utils/discordjs";
import {
	AttachmentBuilder,
	ComponentType,
	Message,
	MessageComponentInteraction,
	MessageReaction,
	OAuth2Scopes,
	PermissionFlagsBits,
	TextInputStyle,
} from "discord.js";

export class ReactionInteraction {
	constructor(reaction, user) {
		const { message, emoji } = reaction;
		const { channel, guild } = message;
		const customId = codeOfEmoji(emoji);
		Object.assign(this, {
			user,
			message,
			channel,
			guild,
			reaction,
			emoji,
			customId,
		});
	}
	msg(...options) {
		return _pushMessage.call(this.channel, ...options);
	}
}

export function jsonFile(data, name) {
	const buffer = Buffer.from(JSON.stringify(data, null, "\t"));
	return new AttachmentBuilder(buffer, {
		name,
	});
}

export function takeInteractionProperties(raw) {
	const { user, message, channel, guild } = raw;
	return { user, message, channel, guild };
}

export async function justModalQuestion({
	title,
	customId = "modal",
	components,
	interaction,
	thanks = false,
}) {
	const toComponentData = (addable, i = 0) => ({
		type: ComponentType.TextInput,
		customId: `${customId}_content_${i}`,
		label: addable.label,
		style: addable.style || TextInputStyle.Paragraph,
		placeholder: addable.placeholder,
		maxLength: addable.maxLength,
	});
	components = components.map(toComponentData);

	const modal = createModal({
		components,
		customId,
		title,
	});

	await interaction.showModal(modal);
	const response = await interaction.awaitModalSubmit({
		filter: (interaction) => customId === interaction.customId,
		time: MINUTE * 5,
	});

	thanks &&
		response?.msg({
			content: thanks !== true ? thanks : "Спасибо!",
			ephemeral: true,
		});

	return { response, fields: response?.fields.fields };
}

export function actionRowsToComponents(actionRows) {
	return actionRows.map((actionRow) =>
		actionRow.components.map((component) => ({
			...component.data,
			customId: component.customId,
		})),
	);
}

export function resolve_message_in_answer(answer) {
	const id =
		answer.content.match(/\d{17,21}/g).at(-1) ?? answer.reference.messageId;
	return id;
}

export function parse_embedInstance(embed) {
	return {
		title: embed.title,
		thumbnail: embed.thumbnail?.url,
		author: embed.author,
		color: embed.hexColor,
		description: embed.description,
		fields: embed.fields,
		image: embed.image?.url,
		timestamp: embed.timestamp,
		footer: embed.footer,
	};
}

export async function awaitUserAccept({ name, message, channel, userData }) {
	const prefix = "userAccept_";
	if (`${prefix}${name}` in userData) {
		return true;
	}
	const context = {};
	context.message = await channel.msg(message);
	const react = await context.message.awaitReact(
		{ user: userData, removeType: "all" },
		"685057435161198594",
		"763807890573885456",
	);
	await context.message.delete();

	if (react === "685057435161198594") {
		userData[`${prefix}${name}`] = 1;
		return true;
	}
	return false;
}

export function awaitInteractOrMessage({
	target,
	user,
	time,
	filter = null,
	reactionOptions = {},
	messageOptions = {},
	componentOptions = {},
}) {
	const MAX_TIMEOUT = time ?? MINUTE * 5;
	const user_checker = (candidate) =>
		(!user && !candidate.bot) || candidate === user;

	const reactions = reactionOptions.reactions?.filter(Boolean);
	reactions?.forEach((reaction) => target.react(reaction));

	const isUserMessage = (message) =>
		message instanceof Message && user_checker(message.author);
	const isReactOfUser = (react, user_was_reacted) =>
		react instanceof MessageReaction &&
		user_checker(user_was_reacted) &&
		(!reactions.length || reactions.includes(codeOfEmoji(react.emoji)));
	const isComponentOfUser = (interaction) =>
		interaction instanceof MessageComponentInteraction &&
		(user_checker(interaction.user) ||
			(() => {
				interaction.msg({
					ephemeral: true,
					description: `Это взаимодействие доступно только ${user}`,
					color: "#ff0000",
				});
			})());

	const pass_interaction = (...params) =>
		[isUserMessage, isReactOfUser, isComponentOfUser].some((callback) =>
			callback(...params),
		) &&
		(!filter || !filter(...params));

	const collectorOptions = {
		max: 1,
		time: MAX_TIMEOUT,
		filter: pass_interaction,
	};

	return new Promise(async (resolve) => {
		const collected = await Promise.race(
			[
				!messageOptions.disable &&
					target.channel.awaitMessages({
						...collectorOptions,
						...messageOptions,
					}),
				reactionOptions.reactions &&
					target.awaitReactions({ ...collectorOptions, ...reactionOptions }),
				componentOptions.listen &&
					target.awaitMessageComponent({
						...collectorOptions,
						...componentOptions,
					}),
			].filter(Boolean),
		);

		const answer = collected.first?.() || collected;
		if (answer instanceof Message) {
			!messageOptions.preventRemove && answer.delete();
		}
		if (answer instanceof MessageReaction) {
			!reactionOptions.preventRemove && answer.users.remove(user);
		}
		resolve(answer);
	});
}

export async function question({
	channel,
	user,
	message,
	time = null,
	reactions = [],
	messageOptions = {},
	listen_components = false,
	validation = null,
	validation_hint = null,
	filter = null,
}) {
	const response = await (async () => {
		while (true) {
			const request = await channel.msg(message);
			const response = await awaitInteractOrMessage({
				target: request,
				user,
				filter,
				messageOptions: {
					remove: true,
					...messageOptions,
				},
				reactionOptions: {
					reactions,
				},
				componentOptions: {
					listen: listen_components,
				},
				time,
			});
			request.delete();
			if (!response) {
				return response;
			}

			if (!validation || (await validation(response))) {
				return response;
			}
			const { isComponent } = await question({
				channel: request.channel,
				message: {
					title: "Прикажите повторить операцию или завершить?",
					user,
					description: `${response instanceof Message ? `-# Ваш ответ:\n\`\`\`\n${response.content}\n\`\`\`\n` : ""}Подсказка взодных данных: ${validation_hint}\n\n-# JavaScript код проверки входных данных\n\`\`\`js\n${validation}\n\`\`\``,
					footer: {
						text: "Контекст автоматически сбросится через минуту",
						iconURL: user?.avatarURL(),
					},
					components: justButtonComponents({
						label: "Продолжить с этого места",
					}),
				},
				messageOptions: {
					disable: true,
				},
				listen_components: true,
				time: MINUTE,
			});

			if (!isComponent) {
				return null;
			}
		}
	})();

	const emoji = response?.emoji;

	return {
		value: response,
		isMessage: response instanceof Message,
		isComponent: response instanceof MessageComponentInteraction,
		content: response?.content,
		emoji: emoji?.id || emoji?.identifier,
	};
}

export function take_missing_permissions(member, bits, channel = null) {
	return channel
		? channel.permissionsFor(member).missing(bits)
		: member.permissions.missing(bits);
}

export function generateInviteFor(client) {
	const scopes = [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands];
	const permissions = [
		PermissionFlagsBits.Administrator,
		PermissionFlagsBits.ManageGuildExpressions,
	];
	return client.generateInvite({ scopes, permissions });
}

export function disable_caller_component(
	of_mut_payload,
	caller_interaction,
	{ apply = true } = {},
) {
	const { message, customId } = caller_interaction;
	const { components } = of_mut_payload;
	components.flat().find(($) => $.customId === customId).disabled = true;
	apply && pushMessage(message, { ...of_mut_payload, edit: true });
}
