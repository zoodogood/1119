import EventsManager, { BaseEvent } from "#lib/modules/EventsManager.js";
import {
  CounterManager,
  DataManager,
  TimeEventsManager,
} from "#lib/modules/mod.js";
import { client } from "#bot/client.js";
import { ReadPackageJson, timestampDay } from "#lib/util.js";
import app from "#app";

class Event extends BaseEvent {
  constructor() {
    const EVENT = "ready";
    super(client, EVENT);
  }

  async postLoading() {
    app.version = (await ReadPackageJson()).version;
    const { default: server } = await import("#server/start.js");
    app.server = server;
    CounterManager.handle();
    TimeEventsManager.handle();

    const needUpdate =
      DataManager.data.bot.currentDay !== timestampDay(Date.now());
    if (needUpdate) {
      await EventsManager.collection.get("TimeEvent/new-day").run(true);
    }
  }

  async run() {
    await this.postLoading();
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
