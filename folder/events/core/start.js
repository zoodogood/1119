import { BaseEvent } from "#lib/modules/EventsManager.js";
import { assert } from "console";
import { omit } from "#src/lib/util.js";

import {
  DataManager,
  TimeEventsManager,
  CommandsManager,
  CounterManager,
  EventsManager,
  StorageManager,
  BossManager,
  UserEffectManager,
  I18nManager,
  ErrorsHandler,
} from "#lib/modules/mod.js";
import { client } from "#bot/client.js";

import app from "#app";
import config from "#config";
import { createStopPromise } from "#lib/createStopPromise.js";
import { Events } from "#constants/app/events.js";

class Event extends BaseEvent {
  constructor() {
    const EVENT = Events.Start;
    super(EventsManager.emitter, EVENT);
  }

  async run() {
    await StorageManager.setDriver(config.database.driver);

    EventsManager.listenAll();

    await DataManager.file.load();
    await TimeEventsManager.file.load();
    // await ReactionsManager.loadReactionsFromFile();
    await CounterManager.file.load();
    await ErrorsHandler.importFileErrorsList();

    this.checkDataManagerFullset();

    await CommandsManager.importCommands();
    CommandsManager.createCallMap();
    await UserEffectManager.importEffects();
    BossManager.BossEffects.updateBasesFromManager();

    app.client = client;
    app.i18n = new I18nManager();
    await app.i18n.load();

    this.processLogin();
  }

  async processLogin() {
    const event = {
      createStopPromise,
      _createStopPromise_stoppers: [],
    };
    EventsManager.emitter.emit(Events.BeforeLogin, event);
    await Promise.all(event._createStopPromise_stoppers);
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
