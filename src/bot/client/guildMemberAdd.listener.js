import { MINUTE } from "#root/src/constants/time.js";
import { sendToLogsChannel } from "#root/src/guild_special_channels/special_channel_enum.js";
import { client } from "#src/bot/client/singleton.js";
import { PermissionFlags } from "#src/discord/permissions.js";
import { BaseEvent } from "#src/events/EventsManager.js";
import { capitalize } from "#src/mini.js";
import { sleep } from "#src/safe-utils.js";
import { Actions } from "#src/user/actions/ActionManager.js";
import { AuditLogEvent, PermissionFlagsBits, UserFlags } from "discord.js";

function getMemberData(member) {
	const { guild } = member;
	const membersData = (guild.data.members ||= {});
	return (membersData[member.id] ||= {});
}

export const LeaveRoles = {
	getOf(member) {
		return getMemberData(member).leave_roles ?? null;
	},

	installPastRolesFor(member) {
		const memberData = getMemberData(member);
		const roles = this.getOf(member);
		if (!roles) {
			return null;
		}

		const { guild } = member;
		for (const roleId of roles) {
			const role = guild.roles.cache.get(roleId);
			role && member.roles.add(role).catch(() => {});
		}
		delete memberData.leave_roles;
	},
};

export const Welcomer = {
	installRolesFor(member) {
		const { guild } = member;
		const rolesId = guild.data.hi?.rolesId;
		if (!rolesId) {
			return;
		}

		for (const roleId of rolesId) {
			const role = guild.roles.cache.get(roleId);
			role && member.roles.add(role);
		}
	},

	async onMember(member) {
		this.installRolesFor(member);
		this.sendGreetingFor(member);
	},

	async sendGreetingFor(member) {
		const { guild } = member;
		const { hi } = guild.data;
		if (!hi?.channel) {
			return;
		}

		const { channel: channelId } = hi;

		const channel = guild.channels.cache.get(channelId);
		if (!channel) {
			const owner = await guild.fetchOwner();
			owner.msg({
				content: `На сервере ${guild.name} настроен канал для приветствий, однако канала с id ${channelId} — не существует`,
			});
			delete hi.channel;
			return;
		}

		channel.sendTyping();
		await sleep(3500);
		await channel.msg({
			title: "На сервере появился новый участник!",
			color: guild.data.hi.color,
			image: guild.data.hi.image,
			description: guild.data.hi.message,
			scope: { tag: member.user.toString(), name: member.user.username },
		});
		channel.msg({ content: "👋", delete: MINUTE * 3 });
	},
};

const BotLogger = {
	stringifyPermissionsOf(member) {
		return (
			member.permissions
				.toArray()
				.map((permission) => PermissionFlags[PermissionFlagsBits[permission]])
				.join(", ") || "Отсуствуют"
		);
	},
	async userWhoAddded(botMember) {
		const { guild } = botMember;
		return await guild.Audit((audit) => audit.target.id === botMember.id, {
			type: AuditLogEvent.BotAdd,
		});
	},

	async onEntry(member) {
		const { guild } = member;
		const whoAdded = await this.userWhoAddded(member);

		sendToLogsChannel(guild, {
			title: "Добавлен бот",
			author: { iconURL: member.user.avatarURL(), name: member.user.tag },
			description: `Название: ${member.user.username}\n${
				member.user.flags.has(UserFlags.VerifiedBot)
					? "Верифицирован 👌"
					: "Ещё не верифицирован ❗"
			}\nКоличество серверов: \`неизвестно\`\n\n${
				whoAdded ? `Бота добавил: ${whoAdded.executor.username}` : ""
			}`,
			footer: {
				text: `Предоставленные права: ${capitalize(
					this.stringifyPermissionsOf(member) ?? "Отсутсвуют",
				)}`,
			},
		});
	},
};

const EnterLogger = {
	async fetchInviteOf(member) {
		const { guild } = member;
		const guildInvites = await guild.invites.fetch().catch(() => {});
		if (!guildInvites) {
			return null;
		}
		return guildInvites.find(
			(invite) => guild.invitesUsesCache.get(invite.code) < invite.uses,
		);
	},

	async processInviter(inviter, invite, entryMember) {
		const {
			guild: { invitesUsesCache },
		} = invite;
		invitesUsesCache.set(
			invite.code,
			(invitesUsesCache.get(invite.code) || 0) + 1,
		);
		if (entryMember.id !== inviter.id) {
			inviter.action(Actions.globalQuest, { name: "inviteFriend" });
		}
		inviter.data.invites = (inviter.data.invites ?? 0) + 1;
	},

	async onMember(entryMember) {
		const invite = await this.fetchInviteOf(entryMember);
		this.writeGuildLog(entryMember, invite);
		invite && this.processInviter(invite.inviter, invite, entryMember);
	},

	writeGuildLog(entryMember, invite) {
		const { guild } = invite;
		const description = `Имя: ${entryMember.user.tag}\nПригласивший: ${invite?.inviter?.tag}\nПриглашение использовано: ${invite?.uses}`;

		sendToLogsChannel(guild, {
			title: "Новый участник!",
			description,
			footer: { text: "Приглашение создано: " },
			timestamp: invite?.createdTimestamp,
		});
	},
};

class Event extends BaseEvent {
	options = {
		name: "client/guildMemberAdd",
	};

	constructor() {
		const EVENT = "guildMemberAdd";
		super(client, EVENT);
	}

	async run(member) {
		Welcomer.onMember(member);
		LeaveRoles.installPastRolesFor(member);
		if (member.user.bot) {
			BotLogger.onEntry(member);
		}
		EnterLogger.onMember(member);
	}
}

export default Event;
