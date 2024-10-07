import app from "#app";
import { client } from "#bot/client.js";
import { Events } from "#constants/app/events.js";
import childProcessUtils from "#lib/child-process-utils.js";
import { DataManager } from "#lib/DataManager/singletone.js";
import EventsManager, { BaseEvent } from "#lib/modules/EventsManager.js";
import { TimeEventsManager } from "#lib/modules/mod.js";
import { ReadPackageJson, timestampDay } from "#lib/util.js";
import { CliParser } from "@zoodogood/utils/primitives";

class AppCli {
  callbacks = {
    "--on-ready": async (capture, value) => {
      if (!value) {
        return;
      }
      const { run } = childProcessUtils({ root: process.cwd() });
      run(process.env.SHELL, ["-c", value]);
    },
  };
  flags = [{ name: "--on-ready", expectValue: true, capture: ["--on-ready"] }];
  setCliParsed(parsed, values) {
    this.cliParsed = [parsed, values];
  }
}

class Event extends BaseEvent {
  options = {
    name: "client/ready",
  };

  constructor() {
    const EVENT = Events.Ready;
    super(client, EVENT);
  }

  parseCli() {
    const manager = new AppCli(this);
    const SYSTEM_ARGV_COUNT = 2;
    const params = process.argv.slice(SYSTEM_ARGV_COUNT).join(" ");
    const parsed = new CliParser()
      .setText(params)
      .processBrackets()
      .captureFlags(manager.flags)
      .collect();

    const values = parsed.resolveValues((capture) => capture?.toString());
    parsed.captures.forEach((capture, key) => {
      manager.callbacks[key]?.(capture, values.get(key));
    });
    manager.setCliParsed(parsed, values);
    return manager;
  }

  async postLoading() {
    app.version = (await ReadPackageJson()).version;
    const { default: server } = await import("#server/start.js");
    app.server = server;

    app.cli = this.parseCli();
    TimeEventsManager.handle();

    const needUpdate =
      DataManager.data.bot.currentDay !== timestampDay(Date.now());
    if (needUpdate) {
      await EventsManager.collection.get("TimeEvent/new-day").run(true);
    }

    TimeEventsManager.getEventsInRange([
      TimeEventsManager.getNearestDay(),
      TimeEventsManager.getNearestDay() + 1,
    ]).find((event) => event.name === "autosave") ||
      (await EventsManager.collection.get("TimeEvent/autosave").run(true));
  }

  async run() {
    await this.postLoading();
    console.info("\n\n\n     Ready...\n\n");

    if (process.env.IN_CONTAINER) {
      console.info(`PROCESS_ID: ${process.pid}`);
    }
    EventsManager.emitter.emit(Events.Ready);
  }
}

export default Event;
