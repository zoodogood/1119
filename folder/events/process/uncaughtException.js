import ErrorsHandler from "#lib/modules/ErrorsHandler.js";
import EventsManager, { BaseEvent } from "#lib/modules/EventsManager.js";

class Event extends BaseEvent {
  constructor() {
    const EVENT = "uncaughtException";
    super(process, EVENT);
  }

  async run(error) {
    ErrorsHandler.Audit.push(error, { uncaughtException: true });
    EventsManager.emitter.emit("beforeExit");
  }

  options = {
    name: "process/uncaughtException",
  };
}

export default Event;
