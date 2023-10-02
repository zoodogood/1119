import client from "#bot/client.js";
import { BaseEvent, EventsManager } from "#lib/modules/EventsManager.js";


async function setMuteState(member, isSetDisable = false){
  const guild = member.guild;

  if (isSetDisable === true){
    guild.channels.cache.each(async channel => {
      await channel.permissionOverwrites.edit(member, {SEND_MESSAGES: null, ADD_REACTIONS: null, SPEAK: null});
      let {allow, deny} = channel.permissionOverwrites.get(member.id) || {allow: {}, deny: {}};

      if (allow.bitfield === 0 && deny.bitfield === 0)
        channel.permissionOverwrites.get(member.id).delete();

    });
    return;
  }

  guild.channels.cache.each(async channel => {
    // let pastPermissions = channel.permissionOverwrites.get(memb.id);
    // let {allow, deny} = pastPermissions || {};
    await channel.permissionOverwrites.edit(member, {
      SEND_MESSAGES: false,
      ADD_REACTIONS: false,
      SPEAK: false
    });
  });

}




class Event extends BaseEvent {
  constructor(){
    const EVENT = "users/muteStateUpdate";
    super(EventsManager.emitter, EVENT);
  }

  

  async run(user, role, isRemoved){
    const guild = role.guild;
    const member = guild.members.resolve(user);
    setMuteState(member, isRemoved);

    const executor = await guild.Audit(
      (audit) => audit.target.id === user.id,
      { type: "MEMBER_ROLE_UPDATE" }
    )?.executor;

    if (!executor) {
      return;
    }
    

    if (executor.id === client.user.id) {
      return;
    }

    let embed = {
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

  options = {
    name: "users/muteStateUpdate"
  };
}


export default Event;