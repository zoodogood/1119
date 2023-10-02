import EventsManager, { BaseEvent } from "#lib/modules/EventsManager.js";


class Event extends BaseEvent {
  constructor() {
    const EVENT = "clent/guildMemberRolesUpdate";
    super(EventsManager.emitter, EVENT);
  }

  async run(previousState, newState) {
    const isRemoved =
      previousState.roles.cache.size - newState.roles.cache.size > 0;

    const role = isRemoved
      ? previousState.roles.cache.find(
        (role) => !newState.roles.cache.get(role.id)
      )
      : previousState.roles.cache.find(
        (role) => !newState.roles.cache.get(role.id)
      );

    if (role.id === newState.guild.data.mute_role) {
      EventsManager.emitter.emit("users/muteStateUpdate", newState.user, role, isRemoved);
    }
  }

  options = {
    name: "client/guildMemberRolesUpdate",
  };
}

export default Event;
