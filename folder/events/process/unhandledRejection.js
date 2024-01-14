import ErrorsHandler from "#lib/modules/ErrorsHandler.js";
import { BaseEvent } from "#lib/modules/EventsManager.js";

class Event extends BaseEvent {
  constructor() {
    const EVENT = "unhandledRejection";
    super(process, EVENT);
  }

  async run(error) {
    const ignoreMessages = [
      "Cannot execute action on a DM channel",
      "Unknown Message",
      "Missing Permissions",
    ];
    if (ignoreMessages.includes(error.message)) {
      return;
    }

    ErrorsHandler.onErrorReceive(error, { uncaughtException: true });
  }

  options = {
    name: "process/unhandledRejection",
  };
}

export default Event;
