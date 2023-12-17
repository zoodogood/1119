import EventsManager, { BaseEvent } from "#lib/modules/EventsManager.js";
import {
  DataManager,
  TimeEventsManager,
  ErrorsHandler,
  CounterManager,
} from "#lib/modules/mod.js";

class Event extends BaseEvent {
  constructor() {
    const EVENT = "beforeExit";
    super(EventsManager.emitter, EVENT);
  }

  async run() {
    try {
      await DataManager.file.write();
      await TimeEventsManager.file.write();
      await CounterManager.file.write();
      await ErrorsHandler.sessionWriteFile();
    } catch (error) {
      console.error(error);
    }

    process.exit();
  }

  options = {
    name: "process/beforeExit",
    once: true,
  };
}

export default Event;
