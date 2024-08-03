import { is_mute_role } from "#folder/events/users/muteStateUpdate.js";
import EventsManager, { BaseEvent } from "#lib/modules/EventsManager.js";

class Event extends BaseEvent {
  options = {
    name: "client/guildMemberRolesUpdate",
  };

  constructor() {
    const EVENT = "client/guildMemberRolesUpdate";
    super(EventsManager.emitter, EVENT);
  }

  async run(previousState, newState) {
    const isRemoved =
      previousState.roles.cache.size - newState.roles.cache.size > 0;

    const role = isRemoved
      ? previousState.roles.cache.find(
          (role) => !newState.roles.cache.has(role.id),
        )
      : newState.roles.cache.find(
          (role) => !previousState.roles.cache.has(role.id),
        );

    if (is_mute_role(role)) {
      EventsManager.emitter.emit(
        "users/muteStateUpdate",
        newState.user,
        role,
        isRemoved,
      );
    }
  }
}

export default Event;
