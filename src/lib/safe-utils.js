import config from "#config";

import { dayjs } from "#lib/dayjs.js";
import {
  CustomCollector,
  DotNotatedInterface,
  GlitchText,
  getRandomElementFromArray,
  omit,
  rangeToArray,
} from "@zoodogood/utils/objectives";
import { ending } from "@zoodogood/utils/primitives";

import Path from "path";
import yaml from "yaml";

export function objectToLocaleDeveloperString(value, deep = 0) {
  if (typeof value !== "object" || value === null) {
    return toLocaleDeveloperString(value);
  }
  return Object.entries(value)
    .map(
      ([key, value]) =>
        `${key}: ${toLocaleDeveloperString(value)}${typeof value === "object" && deep > 0 ? ` —\n${objectToLocaleDeveloperString(value, deep - 1)}` : ""}`,
    )
    .join("\n");
}
export function toLocaleDeveloperString(value) {
  if (!value) {
    return String(value);
  }

  if (typeof value === "string") {
    return `"${value}"`;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "function") {
    return "fn()";
  }

  if (typeof value === "object") {
    const keys = Object.keys(value);
    return `Объект(${keys.length}) <${value.constructor.name}>`;
  }

  return String(value);
}

export function toLocaleDeveloperTypes(value) {
  if (!value) {
    return String(value);
  }

  if (typeof value === "string") {
    return `[String]`;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "function") {
    return "fn()";
  }

  if (typeof value === "object") {
    const keys = Object.keys(value);
    return `${value.constructor.name}(${keys.length}) <${keys}>`;
  }

  return String(value);
}

function sleep(ms) {
  return new Promise((response) => setTimeout(response, ms));
}

function random(...params) {
  let lastArgument = params.splice(-1).at(-1);
  const options = { round: true };

  if (typeof lastArgument === "object") {
    Object.assign(options, lastArgument);
    lastArgument = params.splice(-1).at(-1);
  }

  const max = lastArgument + Number(options.round);
  const min = params.length ? params[0] : 0;
  let rand = Math.random() * (max - min) + min;

  if (options.round) {
    rand = Math.floor(rand);
  }
  return rand;
}

function match(string = "", regular, flags) {
  const reg = RegExp(regular, flags);
  const find = string.match(reg);
  return find ? find[0] : null;
}

function joinWithAndSeparator(arr, ignore = false) {
  if (typeof arr === "string") {
    arr = arr.includes("&AND") && !ignore ? arr.split("&AND") : arr.split(" ");
    arr = arr.filter((el) => el !== "" && el !== " ");
  }
  if (arr.length === 1) {
    return arr[0];
  }

  if (arr.length > 1) {
    arr.last = "и " + arr.last;
  }
  return arr.join(" ");
}

function timestampToDate(ms, max) {
  if (isNaN(ms)) {
    return NaN;
  }

  const date = new Date(Math.max(ms, 0));
  const stamps = [
    {
      ending: ["", "лет", "год", "года"],
      value: date.getUTCFullYear() - 1970,
    },
    {
      ending: ["месяц", "ев", "", "а"],
      value: date.getUTCMonth(),
    },
    {
      ending: ["д", "ней", "ень", "ня"],
      value: date.getUTCDate() - 1,
    },
    {
      ending: ["час", "ов", "", "а"],
      value: date.getUTCHours(),
    },
    {
      ending: ["минут", "", "а", "ы"],
      value: date.getUTCMinutes(),
    },
    {
      ending: ["секунд", "", "а", "ы"],
      value: date.getUTCSeconds(),
    },
  ];

  let input = joinWithAndSeparator(
    stamps
      .filter((stamp) => +stamp.value)
      .map((stamp) => `${ending(stamp.value, ...stamp.ending)}`)
      .slice(0, max || Number.MAX_SAFE_INTEGER)
      .join(", ")
      .trim(),
  );

  if (!input) {
    input = `0,${ms.toString().slice(0, 3)} с.`;
  }

  return input;
}

function timestampDay(timestamp) {
  return Math.floor(timestamp / 86_400_000);
}

function toDayDate(date) {
  if (date instanceof Date === false) {
    date = new Date(date);
  }

  const month = (date.getMonth() + 1).toString();
  const day = date.getDate().toString();

  return `${day.padStart(2, "0")}.${month.padStart(2, "0")}`;
}

function similarity(target, compare) {
  if (target.toLowerCase() === compare.toLowerCase()) {
    return 0;
  }

  target = target.toLowerCase().split("");
  compare = compare.toLowerCase().split("");

  const length = Math.max(target.length, compare.length);
  let index = 0,
    differenceWeight = 0;

  while (index < length) {
    // equal
    if (target[index] === compare[index]) {
      differenceWeight += 0;
    }
    // confused
    else if (
      target[index] === compare[index + 1] &&
      target[index + 1] === compare[index]
    ) {
      target[index] = compare[index + 1];
      target[index + 1] = compare[index];
      compare[index] = target[index];
      compare[index + 1] = target[index + 1];
      differenceWeight += 0.5;
      index++;
    }
    // sinister
    else if (target[index] === compare[index + 1]) {
      compare.splice(index, 1);
      differenceWeight += 0.75;
    }
    // missed
    else if (
      target[index + 1] === compare[index] ||
      compare[index] === undefined
    ) {
      compare.splice(index, 0, target[index]);
      differenceWeight += 0.75;
    }
    // no similar
    else {
      compare[index] = target[index];
      differenceWeight += 1;
    }
    index++;
  }
  return differenceWeight;
}

function getSimilar(strokes, target) {
  if (
    strokes.find((element) => element.toLowerCase() === target.toLowerCase())
  ) {
    return target;
  }
  // differenceWeight
  let currentLargest = Infinity;
  let input;
  strokes
    .filter(
      (element) =>
        element.length - target.length < 2 &&
        element.length - target.length > -2,
    )
    .forEach((element) => {
      const differenceWeight = similarity(target, element);
      if (differenceWeight < currentLargest) {
        currentLargest = differenceWeight;
        input = element;
      }
    });

  if (currentLargest > target.length + 2) {
    return null;
  }
  return input || null;
}

function resolveGithubPath(relative, lineOfCode) {
  const GITHUB_REPO = config.enviroment.github;
  const BRANCH = "version-2";
  const BASE = `${GITHUB_REPO}/blob/${BRANCH}`;
  return `${BASE}/${relative}${lineOfCode ? `#L${lineOfCode}` : ""}`;
}

function NumberFormatLetterize(numb) {
  numb = String(Math.floor(+numb));

  const THRESHOLD = 5;
  const DISTANCE = 3;

  if (numb.length <= THRESHOLD) return numb;

  const cut =
    numb.length - ((numb.length % (THRESHOLD - DISTANCE + 1)) + DISTANCE);
  numb = numb.slice(0, numb.length - cut);
  numb = new Intl.NumberFormat("ru-ru").format(numb);

  const letters = [
    "",
    "K",
    "M",
    "B",
    "T",
    "q",
    "Q",
    "s",
    "S",
    "O",
    "N",
    "d",
    "U",
    "D",
    "z",
    "Z",
    "x",
    "X",
    "c",
    "C",
    "v",
    "V",
    "!",
    "@",
    "#",
    "$",
    "/",
    "%",
    "^",
    "&",
    "*",
  ];
  const letter = letters[~~(cut / DISTANCE)] || `e+${cut}`;
  const SPACE = " ";
  return `${numb}${SPACE}${letter}`;
}

export function numberFormat(value) {
  return new Intl.NumberFormat("ru-ru").format(value);
}

function resolveDate(day, month, year) {
  const date = new Date();
  if (day) {
    date.setDate(day);
  }

  if (month) {
    date.setMonth(month - 1);
  }

  if (year) {
    date.setYear(year);
  }
  return date;
}

function parseDocumentLocate(location) {
  const queries = Object.fromEntries(
    decodeURI(location.search)
      .slice(1)
      .split("&")
      .map((raw) => raw.split("=")),
  );

  const { subpath, base } = parsePagesPath(location.pathname);

  return {
    origin: location.origin,
    subpath,
    queries,
    base: parseLocationBase(base),
  };
}

function parsePagesPath(path) {
  const key = config.server.paths.site.split("/").at(-1);

  const regex = new RegExp(key);
  const index = (path.match(regex)?.index ?? 0) + key.length;
  const base = path.slice(0, index);
  const subpath = path.slice(index).split("/").filter(Boolean);

  return { base, subpath };
}

function parseLocationBase(base) {
  typeof base === "string" && (base = base.split("/"));
  base = base.filter(Boolean);

  const entry = base.at(-1);
  const lang = base.at(-2);
  const prefix = base.at(-3);
  return { prefix, lang, entry };
}

async function fetchFromInnerApi(
  subpath,
  { parseType = "json", ...fetchOptions } = {},
) {
  const path = config.server.origin.concat(`/${Path.normalize(subpath)}`);

  const response = await fetch(path, fetchOptions);
  return response[parseType]();
}

function ReplaceTemplate(string, values) {
  return string.replaceAll(
    /(?<!\\)\$\{([a-zа-яїё_$\s]+)\}/gi,
    (_full, match) => values[match.trim()],
  );
}

function escapeRegexp(value) {
  const regExpSyntaxCharacter = /[\^$\\.*+?()[\]{}|]/g;
  return value.replace(regExpSyntaxCharacter, (character) => `\\${character}`);
}

function uid() {
  const now = Date.now();
  return `${now}_${Math.floor(Math.random() * now)}`;
}

class TimeAuditor {
  constructor() {
    this.createdStamp = Date.now();
    this.stamps = {};
  }

  getDifference(id = 0) {
    return Date.now() - this.stamps[id];
  }

  start(id = 0) {
    this.stamps[id] = Date.now();
  }
}

export function* zeroCenteredSequence() {
  let i = 0;
  while (true) {
    yield i;
    yield -i;
    i++;
  }
}

export function around(array, index, count = 2) {
  const per_side = Math.floor(count / 2);
  const right_space = array.length - index - 1;
  const right_lacks = Math.max(0, per_side - right_space + 1);
  const start = Math.max(0, index - per_side - right_lacks);
  const residue = count - (index - start);
  const end = index + residue + 1;
  return array.slice(start, index).concat(array.slice(index + 1, end));
}

export function clamp(min, value, max) {
  return Math.max(min, Math.min(max, value));
}

export class CircularProtocol {
  collection = new Map();
  pass(element) {
    if (this.collection.has(element)) {
      return false;
    }

    this.collection.set(element, true);
  }
}

export function toFixedAfterZero(value, digits = 1) {
  if (value === 0) {
    return "0";
  }
  // 1 / 0.001 = 1000
  // log10(1000) = 4
  const taget = 1 / value;
  const BASE = 10;
  const zeros = Math.max(0, Math.ceil(Math.log(taget) / Math.log(BASE)));
  return value.toFixed(digits + zeros);
}

export function season_of_month(month) {
  // month format is 1-12
  return ~~((month + 2) / 4);
}

export function fnv_algorithm_hash(str) {
  // init value
  let hash = 2166136261;

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return (hash >>> 0).toString(16);
}

export function use_memo(fn) {
  const cache = new Map();
  return (param) => {
    if (!cache.has(param)) {
      cache.set(param, fn(param));
    }
    return cache.get(param);
  };
}

export {
  CustomCollector,
  DotNotatedInterface,
  GlitchText,
  NumberFormatLetterize,
  ReplaceTemplate,
  TimeAuditor,
  dayjs,
  ending,
  escapeRegexp,
  fetchFromInnerApi,
  getRandomElementFromArray,
  getSimilar,
  joinWithAndSeparator,
  match,
  omit,
  parseDocumentLocate,
  parseLocationBase,
  parsePagesPath,
  random,
  rangeToArray,
  resolveDate,
  resolveGithubPath,
  similarity,
  sleep,
  timestampDay,
  timestampToDate,
  toDayDate,
  uid,
  yaml,
};

export { relativeSiteRoot } from "#site/lib/util.js";
export { MarkdownMetadata } from "./MarkdownMetadata.js";
export {
  ROMAN_NUMERALS_TABLE,
  digitToRoman,
  romanToDigit,
} from "./romanNumerals.js";

export function clone(object) {
  const clone = Object.create(Object.getPrototypeOf(object));
  return Object.assign(clone, object);
}
