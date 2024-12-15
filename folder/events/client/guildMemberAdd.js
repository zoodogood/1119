import { client } from "#bot/client.js";
import { PermissionFlags } from "#constants/enums/discord/permissions.js";
import { Actions } from "#lib/ActionsManager/ActionManager.js";
import { BaseEvent } from "#lib/modules/EventsManager.js";
import * as Util from "#lib/util.js";
import { AuditLogEvent, PermissionFlagsBits, UserFlags } from "discord.js";

function getMemberData(member) {
	const { guild } = member;
	const membersData = (guild.data.members ||= {});
	return (membersData[member.id] ||= {});
}

class LeaveRolesUtil {
	static getLeaveRoles(member) {
		const memberData = getMemberData(member);
		return memberData.leave_roles ?? null;
	}

	static installLeaveRoles(member) {
		const memberData = getMemberData(member);
		const roles = this.getLeaveRoles(member);
		if (!roles) {
			return null;
		}

		const { guild } = member;
		for (const roleId of roles) {
			const role = guild.roles.cache.get(roleId);
			role && member.roles.add(role).catch(() => {});
		}
		delete memberData.leave_roles;
	}
}

class WelcomerUtil {
	static installWelcomeRoles(member) {
		const { guild } = member;
		const rolesId = guild.data.hi?.rolesId;
		if (!rolesId) {
			return;
		}

		for (const roleId of rolesId) {
			const role = guild.roles.cache.get(roleId);
			role && member.roles.add(role);
		}
	}

	static async processWelcomer(member) {
		this.installWelcomeRoles(member);
		this.sendWelcomeMessage(member);
	}

	static async sendWelcomeMessage(member) {
		const { guild } = member;
		if (!guild.data.hiChannel) {
			return;
		}

		const channelId = guild.data.hiChannel;

		const channel = guild.channels.cache.get(channelId);
		if (!channel) {
			const owner = await guild.fetchOwner();
			owner.msg({
				content: `На сервере ${guild.name} настроен канал для приветствий, однако канала с id ${channelId} — не существует`,
			});
			delete guild.data.hiChannel;
			return;
		}

		channel.sendTyping();
		await Util.sleep(3500);
		await channel.msg({
			title: "На сервере появился новый участник!",
			color: guild.data.hi.color,
			image: guild.data.hi.image,
			description: guild.data.hi.message,
			scope: { tag: member.user.toString(), name: member.user.username },
		});
		channel.msg({ content: "👋", delete: 180_000 });
	}
}

class BotLoggerUtil {
	static async getInformation(member) {
		const { guild } = member;
		const whoAdded = await guild.Audit(
			(audit) => audit.target.id === member.id,
			{
				type: AuditLogEvent.BotAdd,
			},
		);

		const permissions =
			member.permissions
				.toArray()
				.map((permission) => PermissionFlags[PermissionFlagsBits[permission]])
				.join(", ") || "Отсуствуют";

		return { permissions, whoAdded };
	}

	static async prepareAndWriteLog(member) {
		const { guild } = member;
		const { permissions, whoAdded } = this.getInformation(member);

		guild.logSend({
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
				text: `Предоставленные права: ${Util.capitalize(
					permissions ?? "Отсутсвуют",
				)}`,
			},
		});
		return;
	}

	static processNewMember(member) {
		if (!member.user.bot) {
			return;
		}

		this.prepareAndWriteLog(member);
	}
}

class EnterLoggerUtil {
	static async fetchInviter(member) {
		const { guild } = member;
		const guildInvites = await guild.invites.fetch().catch(() => {});

		if (!guildInvites) {
			return null;
		}

		const cached = guild.invitesUsesCache;
		const invite = guildInvites.find(
			(invite) => cached.get(invite.code) < invite.uses,
		);

		if (!invite) {
			return null;
		}

		const { inviter } = invite;

		return { invite, inviter };
	}

	static async processInviter({ invite, inviter, member }) {
		const { guild } = member;
		const previous = guild.invitesUsesCache.get(invite.code);
		guild.invitesUsesCache.set(invite.code, (previous || 0) + 1);

		if (member.id !== inviter.id) {
			inviter.action(Actions.globalQuest, { name: "inviteFriend" });
		}

		inviter.data.invites = (inviter.data.invites ?? 0) + 1;
	}

	static async processNewMember(member) {
		const { invite, inviter } = (await this.fetchInviter(member)) ?? {};
		this.writeLog({ invite, inviter, member });
		invite && this.processInviter({ invite, inviter, member });
	}

	static writeLog({ inviter, member, invite }) {
		const { guild } = member;
		const description = `Имя: ${member.user.tag}\nПригласивший: ${inviter?.tag}\nПриглашение использовано: ${invite?.uses}`;

		guild.logSend({
			title: "Новый участник!",
			description,
			footer: { text: "Приглашение создано: " },
			timestamp: invite?.createdTimestamp,
		});
	}
}

class Event extends BaseEvent {
	options = {
		name: "client/guildMemberAdd",
	};

	constructor() {
		const EVENT = "guildMemberAdd";
		super(client, EVENT);
	}

	async run(member) {
		WelcomerUtil.processWelcomer(member);
		LeaveRolesUtil.installLeaveRoles(member);
		BotLoggerUtil.processNewMember(member);
		EnterLoggerUtil.processNewMember(member);
	}
}

export default Event;
