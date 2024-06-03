import FileSystem from "fs";
import EventEmitter from "events";

import StorageManager from "#lib/modules/StorageManager.js";
import {
  timestampDay,
  omit,
  rangeToArray,
  timestampToDate,
} from "#lib/safe-utils.js";

export class TimeEventData {
  _params_as_json;
  createdAt;
  isLost;
  name;
  timestamp;
  constructor(name, timeTo, params) {
    const createdAt = Date.now();
    this.name = name;
    this.timestamp = createdAt + timeTo;
    this.createdAt = createdAt;
    this.params = params;
  }

  static from(name, timestamp, _params_as_json, createdAt) {
    const data = new this();
    data.name = name;
    data.timestamp = timestamp;
    data.createdAt = createdAt;
    data._params_as_json = _params_as_json;
    return data;
  }

  static fromEventData(eventData) {
    return this.from(
      eventData.name,
      eventData.timestamp,
      eventData._params_as_json ||
        (eventData instanceof TimeEventData === false &&
          eventData.params) /* to-do developer-crunch */,
      eventData.createdAt,
    );
  }

  get params() {
    return this._params_as_json ? JSON.parse(this._params_as_json) : null;
  }

  set params(value) {
    this.setParams(value);
  }

  setCreatedAt(createdAt) {
    this.createdAt = createdAt;
    return this;
  }

  setIsLost(isLost) {
    this.isLost = isLost;
    return this;
  }

  setParams(params) {
    if (!params) {
      return;
    }
    this._params_as_json = JSON.stringify(params);
    return this;
  }
}
class TimeEventsManager {
  static #lastSeenDay;

  static data = {};

  static emitter = new EventEmitter();

  static file = {
    path: `${process.cwd()}/folder/data/time.json`,
    load: () => {
      const path = this.file.path;
      const content = FileSystem.readFileSync(path, "utf-8");
      const events = JSON.parse(content, (key, value) =>
        value.name ? TimeEventData.fromEventData(value) : value,
      );
      this.data = events;
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

  static _createEvent(event) {
    const day = timestampDay(event.timestamp);

    this.data[day] ||= [];
    this.data[day].push(event);
    this.data[day].sortBy("timestamp");

    const needUpdate = day <= this.#lastSeenDay || !this.#lastSeenDay;
    if (needUpdate) {
      day < this.#lastSeenDay && (this.#lastSeenDay = null);
      this.handle();
    }

    console.info(`Ивент создан ${event.name}`);
    return event;
  }

  static at(day) {
    return this.data[day];
  }

  static create(eventName, ms, params) {
    const event = new TimeEventData(eventName, ms, params);
    return this._createEvent(event);
  }

  static executeEvent(event) {
    this.remove(event);

    event.setIsLost(Date.now() - event.timestamp < -10_000);
    this.emitter.emit("event", event);
    console.info(`Ивент выполнен ${event.name}`);
    return;
  }

  static fetchNextEvent() {
    const dayEvents = this.getDistancePrefferedDayEvents();
    return dayEvents?.at(0) ?? null;
  }

  static filterEventsInRange(filter, range) {
    const events = this.getEventsInRange(range);
    return events.filter(filter);
  }

  static findBulk(targetTimestamps, filter) {
    const daysMap = {};
    for (const timestamp of targetTimestamps) {
      const day = timestampDay(timestamp);
      daysMap[day] ||= 0;
      daysMap[day]++;
    }

    const events = [];
    for (const day in daysMap) {
      const todayEvents = this.at(day);
      const count = daysMap[day];
      if (!todayEvents) {
        events.push(...new Array(count).fill(null));
        continue;
      }

      let counter = 0;
      for (const event of todayEvents) {
        if (!targetTimestamps.includes(event.timestamp) || !filter(event)) {
          continue;
        }
        counter++;
        events.push(event);
        if (counter === count) {
          break;
        }
      }

      if (counter < count) {
        events.push(...new Array(count - counter).fill(null));
      }
    }
    return events;
  }

  static findEventInRange(filter, range) {
    const events = this.getEventsInRange(range);
    return events.find(filter);
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

  static getEventsInRange(range) {
    const days = [...rangeToArray(range)];
    const events = [];
    for (const day of days) {
      const todayEvents = this.at(day);
      todayEvents && events.push(...todayEvents);
    }

    return events;
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
        },\n  Текущее время: ${parse},\n  Времени до начала: ${timestampToDate(
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

  static remove(event) {
    const day = timestampDay(event.timestamp);
    if (!this.data[day]) {
      return false;
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
  static update(target, data) {
    const endTimestampChanged = data.timestamp !== target.timestamp;
    if (endTimestampChanged) {
      this.remove(target);
    }

    Object.assign(
      target,
      omit(data, (key) =>
        ["name", "timestamp", "params", "createdAt"].includes(key),
      ),
    );

    if (endTimestampChanged) {
      this._createEvent(target);
    }
    return target;
  }
}

export default TimeEventsManager;
