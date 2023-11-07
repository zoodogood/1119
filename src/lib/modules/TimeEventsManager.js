import FileSystem from "fs";
import EventEmitter from "events";

import * as Util from "#lib/util.js";
import StorageManager from "#lib/modules/StorageManager.js";

class TimeEventsManager {
  static #lastSeenDay;

  static at(day) {
    return this.data[day];
  }

  static Util = Util;

  static create(eventName, ms, params) {
    const event = {
      name: eventName,
      timestamp: Date.now() + ms,
      params: params ? JSON.stringify(params) : undefined,
    };
    const day = this.Util.timestampDay(event.timestamp);

    this.data[day] ||= [];
    this.data[day].push(event);
    this.data[day].sortBy("timestamp");

    if (day <= this.#lastSeenDay || !this.#lastSeenDay) {
      day < this.#lastSeenDay && (this.#lastSeenDay = null);
      this.handle();
    }

    console.info(`Ивент создан ${event.name}`);
    return event;
  }

  static findEventInRange(filter, range) {
    const events = this.getEventsInRange(range);
    return events.find(filter);
  }

  static filterEventsInRange(filter, range) {
    const events = this.getEventsInRange(range);
    return events.filter(filter);
  }

  static getEventsInRange(range) {
    const days = Util.rangeToArray(range);
    const events = [];
    for (const day of days) {
      const todayEvents = this.at(day);
      todayEvents && events.push(...todayEvents);
    }

    return events;
  }

  static remove(event) {
    const day = this.Util.timestampDay(event.timestamp);
    if (!this.data[day]) {
      // developer crunch
      const _data = this.data;

      this.data = {};
      const _events = Object.values(_data).reduce(
        (acc, array) => acc.concat(...array),
        [],
      );

      for (const _ev of _events) {
        this.create(
          _ev.name,
          _ev.timestamp - Date.now(),
          _ev.params ? JSON.parse(_ev.params) : undefined,
        );
      }
    }
    const index = this.data[day].indexOf(event);

    if (~index === 0) {
      return false;
    }
    this.data[day].splice(index, 1);

    if (this.data[day].length === 0) {
      delete this.data[day];
    }

    this.handle();
    return true;
  }

  static change(event, data) {
    this.remove(event);
    Object.assign(
      event,
      Util.omit(data, (key) => ["name", "timestamp", "params"].includes(key)),
    );

    this.create(event.name, event.timestamp - Date.now(), event.params);
    return event;
  }

  static fetchNextEvent() {
    const dayEvents = this.getDistancePrefferedDayEvents();
    return dayEvents?.at(0) ?? null;
  }

  static getDistancePrefferedDayEvents(needCache = true) {
    const day = this.#lastSeenDay || this.getNearestDay();

    needCache && (this.#lastSeenDay = day);

    const dayEvents = this.at(day);
    if (!dayEvents) {
      return null;
    }

    // Day without events is not preffered
    if (!dayEvents.length) {
      this.#lastSeenDay = null;
      return this.getDistancePrefferedDayEvents();
    }
    return dayEvents;
  }

  static getExistsDaysList() {
    const days = Object.keys(this.data);
    if (days.length === 0) {
      return null;
    }
    return days;
  }

  static getNearestDay() {
    const days = this.getExistsDaysList();
    if (!days) {
      return null;
    }

    const day = days.reduce((min, day) => Math.min(min, day));

    return +day;
  }

  static handle() {
    this.file.write();

    clearTimeout(this.timeout);

    const event = this.fetchNextEvent();
    if (!event) {
      this.#lastSeenDay = null;
      return;
    }

    const timeTo = event.timestamp - Date.now();
    if (timeTo > 10_000) {
      const parse = new Intl.DateTimeFormat("ru-ru", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format();
      console.info(
        `{\n\n  Имя события: ${
          event.name
        },\n  Текущее время: ${parse},\n  Времени до начала: ${Util.timestampToDate(
          timeTo,
        )}\n\n}`,
      );
    }

    this.timeout = setTimeout(this.onTimeout.bind(this), timeTo);
    return;
  }

  static onTimeout() {
    const event = this.fetchNextEvent();
    if (!event) {
      return;
    }
    if (event.timestamp > Date.now()) {
      return this.handle();
    }

    this.executeEvent(event);
    this.handle();
  }

  static executeEvent(event) {
    this.remove(event);

    const data = {
      name: event.name,
      isLost: Date.now() - event.timestamp < -10000,
      params: event.params ? JSON.parse(event.params) : undefined,
    };
    this.emitter.emit("event", data);
    console.info(`Ивент выполнен ${event.name}`);

    return;
  }

  static file = {
    path: `${process.cwd()}/folder/data/time.json`,
    load: () => {
      const path = this.file.path;
      const content = FileSystem.readFileSync(path, "utf-8");
      const data = JSON.parse(content);
      this.data = data;
    },
    write: async () => {
      const path = this.file.path;
      const data = JSON.stringify(this.data);
      await StorageManager.write("timeEvents.json", data);
      // to-do @deprecated. will be removed
      FileSystem.writeFileSync(path, data);
    },
    defaultData: {},
  };

  static emitter = new EventEmitter();
  static data = {};
}

export default TimeEventsManager;
