import { CommandsManager } from "#lib/modules/mod.js";

class Event {
  async run(timeEventData) {
    const instance = CommandsManager.collection.get("partners");
    instance.daemon.onTimeEvent(timeEventData);
  }

  options = {
    name: "TimeEvent/partner-daemon",
  };
}

export default Event;
