import { client } from "#bot/client.js";
import * as Util from "#lib/util.js";
import {
  TimeEventsManager,
  BossManager,
  DataManager,
  EventsManager,
} from "#lib/modules/mod.js";
import { dayjs } from "#lib/util.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import { NEW_YEAR_DAY_DATE } from "#constants/globals/time.js";
import config from "#config";

class Event {
  async run(isLost) {
    if (this.todayIsAlreadyLaunched()) {
      return;
    }
    const context = {
      isLost,
      today: null,
      currentDay: null,
    };

    DailyAudit.update();
    Object.assign(context, this.setTheClock());
    DailyEvents.updateGrempenProducts();
    DailyEvents.updateBerrysPrice();
    await DailyEvents.checkDayStatsEvent();

    if (isLost) {
      return;
    }

    DailyEvents.distributePresents(context);
    DailyEvents.askTheBoss();
    DailyEvents.checkBirthDays(context);
    DailyEvents.updateCommandsLaunchedData();
  }

  setTheClock() {
    const Data = DataManager.data;
    const today = Util.toDayDate(Date.now());
    const currentDay = Util.timestampDay(Date.now());
    Data.bot.dayDate = today;
    Data.bot.currentDay = currentDay;
    return { today, currentDay };
  }

  calculateTimeForNextCall() {
    return dayjs().endOf("date").add(1, "second") - Date.now();
  }

  createNextCall() {
    const next = this.calculateTimeForNextCall();
    TimeEventsManager.create("new-day", next);
  }

  todayIsAlreadyLaunched() {
    return DataManager.data.bot.dayDate === Util.toDayDate(Date.now());
  }

  options = {
    name: "TimeEvent/new-day",
  };
}

class DailyAudit {
  static AUDIT_LIMIT_IN_DAYS = 365;

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
      bossDamageToday: Data.bot.bossDamageToday,
    };
  }

  static assign(day, data) {
    const Data = DataManager.data.audit;
    Data.daily[day] = data;
  }

  static update() {
    const Data = DataManager.data;

    this.assign(Data.bot.currentDay, this.createData());
    this.cleanProtocol();
    this.cleanDataCollectors();
  }

  static cleanProtocol() {
    const { audit: Data, bot } = DataManager.data;
    const currentDay = bot.currentDay;
    Object.keys(Data.daily)
      .filter((day) => currentDay - day > this.AUDIT_LIMIT_IN_DAYS)
      .forEach((day) => delete Data.daily[day]);
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

class DailyEvents {
  static updateCommandsLaunchedData() {
    const { guilds, bot } = DataManager.data;
    for (const guildData of guilds) {
      const total = Object.values(guildData.commandsUsed).reduce(
        Util.factorySummarize,
        0,
      );
      guildData.commandsLaunched = total;
    }

    const total = Object.values(bot.commandsUsed).reduce(
      Util.factorySummarize,
      0,
    );
    bot.commandsLaunched = total;
  }
  static async checkDayStatsEvent() {
    const botData = DataManager.data.bot;
    const dayStatsEventIsExists = TimeEventsManager.findEventInRange(
      ({ name }) => name === "day-stats",
      [botData.currentDay, botData.currentDay + 1],
    );
    if (!dayStatsEventIsExists) {
      await EventsManager.collection.get("TimeEvent/day-stats").run(true);
    }
  }

  static checkBirthDays({ today }) {
    const birthdaysToday = client.users.cache.filter(
      (memb) => !memb.bot && memb.data.BDay === today,
    ).size;

    if (!birthdaysToday) {
      return;
    }
    client.channels.cache.get(config.guild.logChannelId).msg({
      content: `Сегодня день рождения у ${birthdaysToday} пользователя(ей)`,
    });
  }

  static askTheBoss() {
    client.guilds.cache.each((guild) => BossManager.bossApparance(guild));
  }

  static updateBerrysPrice() {
    const botData = DataManager.data.bot;
    const berryRandom = [
      { _weight: 10, price: 1 },
      { _weight: 1, price: -7 },
      { _weight: 5, price: 3 },
    ].random({ weights: true }).price;
    const berryTarget = Math.sqrt(client.users.cache.size / 3) * 7 + 200;
    botData.berrysPrice += Math.round(
      (berryTarget - botData.berrysPrice) / 30 + berryRandom,
    );
  }

  static distributePresents(context) {
    if (DataManager.data.bot.dayDate !== NEW_YEAR_DAY_DATE) {
      return;
    }

    const usersCache = client.users.cache;

    for (const user of usersCache.values()) {
      Util.addResource({
        user,
        value: 1,
        executor: null,
        source: "timeEventsManager.event.new-day.happySnowy",
        resource: PropertiesEnum.presents,
        context,
      });
    }

    const users = DataManager.data.users;
    client.channels.cache.get(config.guild.logChannelId).msg({
      content: `${Util.ending(
        usersCache.size,
        "пользовател",
        "ей получило",
        "ь получил",
        "ля получило",
      )} подарки! из ${users.length} возможных*`,
    });
  }

  static updateGrempenProducts() {
    const botData = DataManager.data.bot;
    botData.grempenItems = "";
    const arr = [
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
      botData.grempenItems += arr.random({ pop: true });
    }
  }
}

export default Event;
export { DailyAudit };
