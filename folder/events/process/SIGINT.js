import EventsManager, { BaseEvent } from "#lib/modules/EventsManager.js";

class Event extends BaseEvent {
  options = {
    name: "process/SIGINT",
  };

  constructor() {
    const EVENT = "SIGINT";
    super(process, EVENT);
  }

  async run() {
    EventsManager.emitter.emit("beforeExit");
  }
}

export default Event;
