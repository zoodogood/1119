import { client } from "#src/bot/client/singleton.js";
import {
	is_mute_role_by_name,
	setMuteState,
} from "#src/mute/muteStateUpdate.listener.js";

class Event {
	options = {
		name: "timeEvent/mute-end",
	};

	run(eventData, guildId, memberId) {
		const guild = client.guilds.cache.get(guildId);
		const member = guild?.members.resolve(memberId);
		const role =
			member.roles.cache.get(guild.data.mute_role) ||
			member.roles.cache.find((role) => is_mute_role_by_name(role));

		if (role) {
			member.roles.remove(role.id);
		} else {
			setMuteState(member, true);
		}

		guild.logSend({
			title: "Действие мута завершено",
			description: `С участника по прошедствию времени автоматически сняты ограничения на общения в чатах.`,
			author: {
				name: member.displayName,
				iconURL: member.user.displayAvatarURL(),
			},
		});
	}
}

export default Event;
