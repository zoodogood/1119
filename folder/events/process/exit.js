import { BaseEvent } from "#lib/modules/EventsManager.js";

class Event extends BaseEvent {
  options = {
    name: "process/exit",
    once: true,
  };

  constructor() {
    const EVENT = "exit";
    super(process, EVENT);
  }

  async run() {
    console.info("\n   ЗАВЕРШЕНИЕ...\n");
  }
}

export default Event;
