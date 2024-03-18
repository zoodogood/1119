import dayjs from "dayjs";
import duration from "dayjs/plugin/duration.js";
import toObject from "dayjs/plugin/toObject.js";
dayjs.extend(duration);
dayjs.extend(toObject);
export { dayjs };
