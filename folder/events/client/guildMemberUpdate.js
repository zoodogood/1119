import EventsManager, { BaseEvent } from "#lib/modules/EventsManager.js";
import { client } from "#bot/client.js";

class Event extends BaseEvent {
  constructor(){
    const EVENT = "guildMemberUpdate";
    super(client, EVENT);

		
  }

	
  async run(previousState, newState){
	
    const isNameEdited = newState.user.data.name !== newState.user.username || previousState.displayName !== newState.displayName;
    if (isNameEdited){
      EventsManager.emitter.emit("client/userNameUpdate", previousState, newState);
    }

    if (previousState.roles.cache.size !== newState.roles.cache.size){
      EventsManager.emitter.emit("client/guildMemberRolesUpdate", previousState, newState);
    }
  }

  options = {
    name: "client/guildMemberUpdate"
  };
}

export default Event;