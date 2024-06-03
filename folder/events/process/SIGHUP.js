import EventsManager, { BaseEvent } from "#lib/modules/EventsManager.js";

class Event extends BaseEvent {
  options = {
    name: "process/SIGHUP",
  };

  constructor() {
    const EVENT = "SIGHUP";
    super(process, EVENT);
  }

  async run() {
    EventsManager.emitter.emit("beforeExit");
  }
}

export default Event;
