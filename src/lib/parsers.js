import { DAY, HOUR, MINUTE, SECOND } from "#constants/globals/time.js";
import dayjs from "dayjs";

export class ParserTime {
  regex =
    /(?<time>\d\d:\d\d)|(?<date>\d\d\.\d\d)|(?<stamp>\d+\s?(д|d|ч|h|м|m|с|s)[a-zа-яъё]*?)/i;

  items = [];
  time = 0;
  /**@type {ReturnType<dayjs>} */
  #date;

  /**@type {ReturnType<dayjs>} */
  get date() {
    this.#date ||= dayjs();
    return this.#date;
  }

  set date(value) {
    this.#date = value;
  }

  pushItem(item) {
    this.items.push(item);
  }

  summarizeItems() {
    for (const item of this.items) {
      this.processItem(item);
    }

    return this.diffDateTime(Date.now()) + this.time;
  }

  stampToNumber(stamp) {
    const [value, key] = stamp.match(/(\d+)\s?([a-zа-я])/)?.slice(1) ?? [];
    const consts = {
      d: DAY,
      д: DAY,
      h: HOUR,
      ч: HOUR,
      m: MINUTE,
      м: MINUTE,
      s: SECOND,
      с: SECOND,
    };
    return consts[key] * value;
  }

  diffDateTime(compare) {
    if (!this.#date) {
      return 0;
    }

    return this.#date.toDate().getTime() - compare;
  }

  appendStamp(stamp) {
    this.time += this.stampToNumber(stamp);
  }

  appendTime(time) {
    const [hours, minutes] = time.split(":").map(Number);
    this.date = this.date.set("hour", hours).set("minute", minutes);
  }

  appendDate(date) {
    const [day, month] = date.split(".").map(Number);
    this.date = this.date.set("date", day).set("month", month - 1);
  }

  processItem(item) {
    switch (item.key) {
      case "time":
        return this.appendTime(item.value);
      case "date":
        return this.appendDate(item.value);
      case "stamp":
        return this.appendStamp(item.value);
    }
  }

  static toNumber(string) {
    const parser = new this();
    const multipleRegex = RegExp(parser.regex, "g");
    const matchs = string.matchAll(multipleRegex);
    for (const { groups } of matchs) {
      const key = this._getActiveGroupName(groups);
      const item = { key, value: groups[key] };
      parser.pushItem(item);
    }
    return parser.summarizeItems();
  }

  static _getActiveGroupName(groups) {
    for (const group in groups) {
      if (groups[group]) {
        return group;
      }
    }
    return null;
  }
}
