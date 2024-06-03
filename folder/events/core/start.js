import { BaseEvent } from "#lib/modules/EventsManager.js";
import { omit } from "#src/lib/util.js";
import { assert } from "console";

import { client } from "#bot/client.js";
import {
  BossManager,
  CommandsManager,
  CounterManager,
  DataManager,
  ErrorsHandler,
  EventsManager,
  I18nManager,
  StorageManager,
  TimeEventsManager,
  UserEffectManager,
} from "#lib/modules/mod.js";

import app from "#app";
import config from "#config";
import { Events } from "#constants/app/events.js";
import { createStopPromise } from "#lib/createStopPromise.js";

class Event extends BaseEvent {
  options = {
    name: "core/start",
  };

  constructor() {
    const EVENT = Events.Start;
    super(EventsManager.emitter, EVENT);
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

  async processLogin() {
    const event = {
      ...createStopPromise(),
    };
    EventsManager.emitter.emit(Events.BeforeLogin, event);
    await event.whenStopPromises();
    client.login(process.env.DISCORD_TOKEN);
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
}

export default Event;
