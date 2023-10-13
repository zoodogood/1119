import EventsManager, { BaseEvent } from "#lib/modules/EventsManager.js";



class Event extends BaseEvent {
  constructor(){
    const EVENT = "SIGUSR1";
    super(process, EVENT);
  }

  async run(){
    EventsManager.emitter.emit("beforeExit");
  }

  options = {
    name: "process/SIGUSR1"
  };
}

export default Event;