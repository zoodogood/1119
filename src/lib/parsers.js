import { DAY, HOUR, MINUTE, SECOND } from "#constants/globals/time.js";
import dayjs from "dayjs";

export class ParserTime {
  /**@type {ReturnType<dayjs>} */
  #date;

  items = [];
  regex =
    /(?<time>\d\d:\d\d)|(?<date>\d\d\.\d\d(?:\.\d\d\d\d)?)|(?<stamp>\d+\s?(д|d|ч|h|м|m|с|s)\.?\S*)/i;
  time = 0;

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

  appendDate(date) {
    const [day, month, year] = date.split(".").map(Number);
    const value = this.date.set("date", day).set("month", month - 1);

    if (year) {
      value.set("year", year);
    }
    this.date = value;
  }

  appendStamp(stamp) {
    this.time += this.stampToNumber(stamp);
  }

  appendTime(time) {
    const [hours, minutes] = time.split(":").map(Number);
    this.date = this.date.set("hour", hours).set("minute", minutes);
  }

  diffDateTime(compare) {
    if (!this.#date) {
      return 0;
    }

    return this.#date.toDate().getTime() - compare;
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

  pushItem(item) {
    this.items.push(item);
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

  summarizeItems() {
    for (const item of this.items) {
      this.processItem(item);
    }

    return this.diffDateTime(Date.now()) + this.time;
  }

  /**@type {ReturnType<dayjs>} */
  get date() {
    this.#date ||= dayjs();
    return this.#date;
  }

  set date(value) {
    this.#date = value;
  }
}
