import { REASON_FOR_CHANGE_NICKNAME as CHILLI_REASON_FOR_CHANGE_NICKNAME } from "#folder/commands/chilli.js";
import EventsManager, { BaseEvent } from "#lib/modules/EventsManager.js";
import { AuditLogEvent } from "discord.js";



class Event extends BaseEvent {
  constructor() {
    const EVENT = "client/userNameUpdate";
    super(EventsManager.emitter, EVENT);
  }

  async checkAudit(newState){
    const {guild, user} = newState;

    if (!guild){
      return;
    }
    
    const entry = await guild.Audit((entry) => entry.target.id === user.id, {type: AuditLogEvent.MemberUpdate});
    
    
    if (!entry){
      return null;
    }

    return entry;
  }

  async getContext(previousState, newState){
    const guild = newState.guild;

    const {reason} = await this.checkAudit(newState) ?? {};

    const isChangedOnlyDisplayName =
      previousState.displayName !== newState.displayName;

    const [previousValue, newValue] = isChangedOnlyDisplayName
      ? [previousState.displayName, newState.displayName]
      : [previousState.user.username, newState.user.username];

    return {
      guild,
      reason,
      previousState,
      newState,
      isChangedOnlyDisplayName,
      previousValue,
      newValue
    };
  }

  async run(previousState, newState) {
    const context = await this.getContext(previousState, newState);
    

    const { isChangedOnlyDisplayName, guild, reason } = context;
   

    if (!isChangedOnlyDisplayName) {
      newState.user.data.name = newState.user.username;
    }


    const isLogNeed = reason !== CHILLI_REASON_FOR_CHANGE_NICKNAME && guild;
    
    if (isLogNeed){
      this.sendAuditLog(context);
    }
  }

  sendAuditLog(context){
    const {guild, isChangedOnlyDisplayName, newState, previousValue, newValue, reason} = context;
    const title = `Новое имя: ${newValue}`;

    guild.logSend({
      title,
      description: reason ? `Указанная причина: ${ reason }` : null,
      author: {
        name: isChangedOnlyDisplayName
          ? "На сервере изменился\nник пользователя"
          : "Участник изменил свой никнейм",
        iconURL: newState.user.avatarURL(),
      },
      footer: { text: `Старый никнейм: ${previousValue}` },
    });
  }

  options = {
    name: "client/userNameUpdate",
  };
}

export default Event;
