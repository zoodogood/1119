import EventsManager, { BaseEvent } from "#lib/modules/EventsManager.js";



class Event extends BaseEvent {
  constructor(){
    const EVENT = "SIGHUP";
    super(process, EVENT);
  }

  async run(){
    EventsManager.emitter.emit("beforeExit");
  }

  options = {
    name: "process/SIGHUP"
  };
}

export default Event;