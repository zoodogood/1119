import { BaseEvent } from "#lib/modules/EventsManager.js";
import { assert } from "console";
import { omit, timestampDay } from "#src/lib/util.js";

import {
  DataManager,
  TimeEventsManager,
  CommandsManager,
  CounterManager,
  EventsManager,
  StorageManager,
  BossManager,
  UserEffectManager,
} from "#lib/modules/mod.js";
import { client } from "#bot/client.js";

import app from "#app";
import config from "#config";

class Event extends BaseEvent {
  constructor() {
    const EVENT = "start";
    super(EventsManager.emitter, EVENT);
  }

  async run() {
    await StorageManager.setDriver(config.database.driver);

    EventsManager.listenAll();

    await DataManager.file.load();
    await TimeEventsManager.file.load();
    // await ReactionsManager.loadReactionsFromFile();
    await CounterManager.file.load();

    this.checkDataManagerFullset();

    await CommandsManager.importCommands();
    CommandsManager.createCallMap();
    await UserEffectManager.importEffects();
    BossManager.BossEffects.updateBasesFromManager();

    TimeEventsManager.handle();

    const needUpdate =
      DataManager.data.bot.currentDay !== timestampDay(Date.now());
    if (needUpdate) {
      await EventsManager.collection.get("TimeEvent/new-day").run(true);
    }

    app.client = client;
    client.login(process.env.DISCORD_TOKEN);
  }

  checkDataManagerFullset() {
    const Data = DataManager.data;

    assert(Data.users);
    assert(Data.guilds);
    assert(Data.bot);
    const defaultData = {
      commandsUsed: {},
    };

    Object.assign(
      Data.bot,
      omit(defaultData, (k) => k in Data.bot === false),
    );

    Data.bot.messagesToday ||= 0;

    Data.site ||= {};
    Data.site.enterToPages ||= {};
    Data.site.entersToPages ||= 0;
    Data.site.entersToPagesToday ||= 0;
    Data.site.enterToAPI ||= {};
    Data.site.entersToAPI ||= 0;
    Data.site.entersToAPIToday ||= 0;
    Data.bot.bossDamageToday ||= 0;

    Data.audit ||= {};
    Data.audit.daily ||= {};
    Data.audit.resourcesChanges ||= {};
    Data.audit.actions ||= {};

    const now = Date.now();
    Data.users.forEach((userData) =>
      Object.keys(userData).forEach((key) =>
        key.startsWith("CD") && userData[key] < now
          ? delete userData[key]
          : false,
      ),
    );
    Data.guilds.forEach((guildData) => {
      delete guildData.stupid_evil;
    });
    Data.users = Data.users.sort((a, b) => b.level - a.level);

    Data.bot.berrysPrice ||= 200;
    Data.bot.grempenItems ||= "123456";
  }

  options = {
    name: "core/start",
  };
}

export default Event;
