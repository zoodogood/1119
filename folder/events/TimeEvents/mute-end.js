import { client } from "#bot/client.js";

class Event {
  options = {
    name: "TimeEvent/mute-end",
  };

  run(eventData, guildId, memberId) {
    const guild = client.guilds.cache.get(guildId);
    const member = guild?.members.resolve(memberId);
    const role = member.roles.cache.get(guild.data.mute_role);
    if (!role) {
      return;
    }

    guild.logSend({
      title: "Действие мута завершено",
      description: `С участника по прошедствию времени автоматически сняты ограничения на общения в чатах.`,
      author: {
        name: member.displayName,
        iconURL: member.user.displayAvatarURL(),
      },
    });
    member.roles.remove(role.id);
  }
}

export default Event;
