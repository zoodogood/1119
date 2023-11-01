import { client } from "#bot/client.js";
import * as Util from "#lib/util.js";
import {
  TimeEventsManager,
  BossManager,
  DataManager,
  EventsManager,
} from "#lib/modules/mod.js";
import { dayjs } from "#lib/util.js";

class DailyAudit {
  static AUDIT_LINIT_IN_DAYS = 365;

  static createData() {
    const Data = DataManager.data;

    return {
      enterToPages: Data.site.entersToPagesToday,
      enterToAPI: Data.site.entersToAPIToday,
      commandsUsed: Data.bot.commandsUsedToday,
      messages: Data.bot.messagesToday,
      riches:
        Data.users.reduce((acc, { coins }) => acc + ~~coins, 0) +
        Data.guilds.reduce((acc, { coins }) => acc + ~~coins, 0),
    };
  }

  static assign(day, data) {
    const Data = DataManager.data;
    Data.dailyAudit[day] = data;
  }

  static update() {
    const Data = DataManager.data;

    this.assign(Data.bot.currentDay, this.createData());
    this.cleanProtocol();
    this.cleanDataCollectors();
  }

  static cleanProtocol() {
    const Data = DataManager.data;
    const currentDay = Data.bot.currentDay;
    Object.keys(Data.dailyAudit)
      .filter((day) => currentDay - day > this.AUDIT_LINIT_IN_DAYS)
      .forEach((day) => delete Data.dailyAudit[day]);
  }

  static cleanDataCollectors() {
    const Data = DataManager.data;

    Data.site.entersToPagesToday = 0;
    Data.site.entersToAPIToday = 0;
    Data.bot.commandsUsedToday = 0;
    Data.bot.messagesToday = 0;
    Data.bot.bossDamageToday = 0;
  }
}

class Event {
  todayIsAlreadyLaunched() {
    return DataManager.data.bot.dayDate === Util.toDayDate(Date.now());
  }

  async run(isLost) {
    const Data = DataManager.data;
    if (this.todayIsAlreadyLaunched()) {
      return;
    }

    let next = dayjs().endOf("date").add(1, "second") - Date.now();
    TimeEventsManager.create("new-day", next);

    DailyAudit.update();

    const today = Util.toDayDate(Date.now());
    Data.bot.dayDate = today;
    Data.bot.currentDay = Util.timestampDay(Date.now());

    Data.bot.grempen = "";
    let arr = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "a",
      "b",
      "c",
      "d",
      "e",
    ]; //0123456789abcdef
    for (let i = 1; i < 7; i++) {
      DataManager.data.bot.grempen += arr.random({ pop: true });
    }

    let berryRandom = [
      { _weight: 10, price: 1 },
      { _weight: 1, price: -7 },
      { _weight: 5, price: 3 },
    ].random({ weights: true }).price;
    let berryTarget = Math.sqrt(client.users.cache.size / 3) * 7 + 200;
    Data.bot.berrysPrice += Math.round(
      (berryTarget - Data.bot.berrysPrice) / 30 + berryRandom,
    );

    if (isLost) {
      return;
    }

    client.guilds.cache.each((guild) => BossManager.bossApparance(guild));

    const birthdaysToday = client.users.cache.filter(
      (memb) => !memb.bot && memb.data.BDay === today,
    ).length;

    if (birthdaysToday) {
      console.info(
        `Сегодня день рождения у ${birthdaysToday} пользователя(ей)`,
      );
    }

    Data.guilds.forEach(
      (e) =>
        (e.commandsLaunched = Object.values(e.commandsUsed).reduce(
          (acc, e) => acc + e,
          0,
        )),
    );

    const commandsLaunched = Object.values(Data.bot.commandsUsed).reduce(
      (acc, e) => acc + e,
      0,
    );
    Data.bot.commandsLaunched = commandsLaunched;

    const dayStatsEventIsExists = TimeEventsManager.findEventInRange(
      ({ name }) => name === "day-stats",
      [Data.bot.currentDay, Data.bot.currentDay + 1],
    );
    if (!dayStatsEventIsExists) {
      await EventsManager.collection.get("TimeEvent/day-stats").run(true);
    }
  }

  options = {
    name: "TimeEvent/new-day",
  };
}

export default Event;
export { DailyAudit };
