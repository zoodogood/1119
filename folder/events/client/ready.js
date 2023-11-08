import { BaseEvent } from "#lib/modules/EventsManager.js";
import { CounterManager } from "#lib/modules/mod.js";
import { client } from "#bot/client.js";
import { ReadPackageJson } from "#lib/util.js";
import app from "#app";

class Event extends BaseEvent {
  constructor() {
    const EVENT = "ready";
    super(client, EVENT);
  }

  async run() {
    CounterManager.handle();
    app.version = (await ReadPackageJson()).version;

    const { default: server } = await import("#server/start.js");
    app.server = server;

    console.info("\n\n\n     Ready...\n\n");

    if (process.env.IN_CONTAINER) {
      console.info(`PROCESS_ID: ${process.pid}`);
    }
  }

  options = {
    name: "client/ready",
  };
}

export default Event;
