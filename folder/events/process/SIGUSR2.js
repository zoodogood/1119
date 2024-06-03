import EventsManager, { BaseEvent } from "#lib/modules/EventsManager.js";

class Event extends BaseEvent {
  options = {
    name: "process/SIGUSR2",
  };

  constructor() {
    const EVENT = "SIGUSR2";
    super(process, EVENT);
  }

  async run() {
    EventsManager.emitter.emit("beforeExit");
  }
}

export default Event;
