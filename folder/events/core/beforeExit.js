import EventsManager, { BaseEvent } from "#lib/modules/EventsManager.js";
import { DataManager, TimeEventsManager, ErrorsHandler } from "#lib/modules/mod.js";


class Event extends BaseEvent {
  constructor(){
    const EVENT = "beforeExit";
    super(EventsManager.emitter, EVENT);
  }

  async run(){
    DataManager.file.write();
    TimeEventsManager.file.write();
    ErrorsHandler.Audit.createLog();

		
    process.exit();
  }

  options = {
    name: "process/beforeExit",
    once: true
  };
}

export default Event;