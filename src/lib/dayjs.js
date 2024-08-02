import dayjs from "dayjs";
import duration from "dayjs/plugin/duration.js";
import toObject from "dayjs/plugin/toObject.js";
dayjs.extend(duration);
dayjs.extend(toObject);

/**
 * @param {dayjs.Dayjs} date
 */
export function dayjs_ensure_coming_year(date) {
  if (date.isAfter()) {
    return date;
  }
  return date.add(1, "year");
}

export { dayjs };
