import EventsManager, { BaseEvent } from "#lib/modules/EventsManager.js";
import {
  CounterManager,
  DataManager,
  TimeEventsManager,
} from "#lib/modules/mod.js";
import { client } from "#bot/client.js";
import { ReadPackageJson, timestampDay } from "#lib/util.js";
import app from "#app";
import childProcessUtils from "#lib/child-process-utils.js";
import { CliParser } from "@zoodogood/utils/primitives";

class AppCli {
  setCliParsed(parsed, values) {
    this.cliParsed = [parsed, values];
  }
  flags = [{ name: "--on-ready", expectValue: true, capture: ["--on-ready"] }];
  callbacks = {
    "--on-ready": async (capture, value) => {
      if (!value) {
        return;
      }
      const { run } = childProcessUtils({ root: process.cwd() });
      run("zsh", ["-c", value]);
    },
  };
}

class Event extends BaseEvent {
  constructor() {
    const EVENT = "ready";
    super(client, EVENT);
  }

  async postLoading() {
    app.version = (await ReadPackageJson()).version;
    const { default: server } = await import("#server/start.js");
    app.server = server;

    app.cli = this.parseCli();
    CounterManager.handle();
    TimeEventsManager.handle();

    const needUpdate =
      DataManager.data.bot.currentDay !== timestampDay(Date.now());
    if (needUpdate) {
      await EventsManager.collection.get("TimeEvent/new-day").run(true);
    }
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
