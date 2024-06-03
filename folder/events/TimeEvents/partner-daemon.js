import { CommandsManager } from "#lib/modules/mod.js";

class Event {
  options = {
    name: "TimeEvent/partner-daemon",
  };

  async run(timeEventData) {
    const instance = CommandsManager.collection.get("partners");
    instance.daemon.onTimeEvent(timeEventData);
  }
}

export default Event;
