import client from "#bot/client.js";
import { BaseEvent, EventsManager } from "#lib/modules/EventsManager.js";
import { AuditLogEvent, PermissionFlagsBits } from "discord.js";

export function is_mute_role(role) {
  return role.id === role.guild.data.mute_role || is_mute_role_by_name(role);
}
export function is_mute_role_by_name(role) {
  return "mute muted замучен мьют мут замьючен".includes(
    role.name.toLowerCase(),
  );
}
async function setMuteState(member, toDisable = false) {
  const guild = member.guild;

  if (toDisable === true) {
    guild.channels.cache.each(async (channel) => {
      await channel.permissionOverwrites.edit(member, {
        [PermissionFlagsBits.SendMessages]: null,
        [PermissionFlagsBits.AddReactions]: null,
        [PermissionFlagsBits.Speak]: null,
      });

      const { allow, deny } =
        channel.permissionOverwrites.valueOf().get(member.id) || {};

      if (allow?.bitfield === 0 && deny?.bitfield === 0)
        channel.permissionOverwrites.delete(member.id);
    });
    return;
  }

  guild.channels.cache.each(async (channel) => {
    await channel.permissionOverwrites.edit(member, {
      [PermissionFlagsBits.SendMessages]: false,
      [PermissionFlagsBits.AddReactions]: false,
      [PermissionFlagsBits.Speak]: false,
    });
  });
}

class Event extends BaseEvent {
  options = {
    name: "users/muteStateUpdate",
  };

  constructor() {
    const EVENT = "users/muteStateUpdate";
    super(EventsManager.emitter, EVENT);
  }

  async run(user, role, isRemoved) {
    const guild = role.guild;
    const member = guild.members.resolve(user);

    setMuteState(member, isRemoved);

    const { executor } =
      (await guild.Audit((audit) => audit.target.id === user.id, {
        type: AuditLogEvent.MemberRoleUpdate,
      })) || {};

    if (!executor) {
      return;
    }

    if (executor.id === client.user.id) {
      return;
    }

    const embed = {
      title: isRemoved ? "Мут снят" : "Участнику выдан мут",
      description: isRemoved
        ? "С участника снята роль мута ограничивающая общение в чатах."
        : `Пользователь ${user.toString()} получил роль мута — это запрещает ему отправлять сообщения во всех чатах`,
      author: {
        name: member.displayName,
        iconURL: user.displayAvatarURL(),
      },
      footer: {
        text: `Мут ${isRemoved ? "снял" : "выдал"} ${executor.username}`,
        iconURL: executor.avatarURL(),
      },
    };

    guild.logSend(embed);
  }
}

export default Event;
