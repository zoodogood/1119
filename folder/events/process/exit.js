import { BaseEvent } from "#lib/modules/EventsManager.js";



class Event extends BaseEvent {
  constructor(){
    const EVENT = "exit";
    super(process, EVENT);
  }

  async run(){
    console.info("\n   ЗАВЕРШЕНИЕ...\n");
  }

  options = {
    name: "process/exit",
    once: true
  };
}

export default Event;