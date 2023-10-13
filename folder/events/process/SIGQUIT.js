import EventsManager, { BaseEvent } from "#lib/modules/EventsManager.js";



class Event extends BaseEvent {
  constructor(){
    const EVENT = "SIGQUIT";
    super(process, EVENT);
  }

  async run(){
	
    EventsManager.emitter.emit("beforeExit");
  }

  options = {
    name: "process/SIGQUIT"
  };
}

export default Event;