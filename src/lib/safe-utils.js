import config from "#config";

import { ending } from "@zoodogood/utils/primitives";
import {
  omit,
  CustomCollector,
  GlitchText,
  rangeToArray,
  getRandomElementFromArray,
  DotNotatedInterface,
} from "@zoodogood/utils/objectives";
import dayjs from "dayjs";
import * as FlattedJSON from "flatted";
dayjs.extend((await import("dayjs/plugin/duration.js")).default);

import yaml from "yaml";
import Path from "path";

function toLocaleDeveloperString(value) {
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

  const date = new Date(Math.max(ms, 0)),
    s = date.getUTCSeconds() + "с",
    m = date.getUTCMinutes() + "м ",
    h = date.getUTCHours() + "ч ",
    d = date.getUTCDate() - 1 + "д ",
    mo = date.getUTCMonth() + "мес. ",
    y =
      date.getUTCFullYear() -
      1970 +
      (date.getUTCFullYear() - 1970 > 4 ? "л " : "г ");

  let input = joinWithAndSeparator(
    [y, mo, d, h, m, s]
      .filter((stamp) => +stamp[0])
      .slice(0, max || 7)
      .join(" ")
      .trim(),
  );

  if (!input) {
    input = `0,${ms.toString().slice(0, 3)}с`;
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
  numb = new Intl.NumberFormat().format(numb);

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
    /(?<!\\)\$\{([a-zа-яъё_$\s]+)\}/gi,
    (_full, match) => values[match.trim()],
  );
}

function escapeRegexp(value) {
  const regExpSyntaxCharacter = /[\^$\\.*+?()[\]{}|]/g;
  return value.replace(regExpSyntaxCharacter, (character) => `\\${character}`);
}

function uid() {
  const now = Date.now();
  return `${now}-${~~Math.random() * now}`;
}

class TimeAuditor {
  constructor() {
    this.createdStamp = Date.now();
    this.stamps = {};
  }

  start(id = 0) {
    this.stamps[id] = Date.now();
  }

  getDifference(id = 0) {
    return Date.now() - this.stamps[id];
  }
}

export {
  ending,
  omit,
  CustomCollector,
  DotNotatedInterface,
  GlitchText,
  TimeAuditor,
  dayjs,
  yaml,
  toLocaleDeveloperString,
  sleep,
  rangeToArray,
  getRandomElementFromArray,
  random,
  match,
  escapeRegexp,
  ReplaceTemplate,
  similarity,
  getSimilar,
  joinWithAndSeparator,
  NumberFormatLetterize,
  uid,
  toDayDate,
  timestampDay,
  timestampToDate,
  resolveDate,
  resolveGithubPath,
  parseDocumentLocate,
  parsePagesPath,
  parseLocationBase,
  fetchFromInnerApi,
  FlattedJSON
};

export { relativeSiteRoot } from "#site/lib/util.js";
export { MarkdownMetadata } from "./MarkdownMetadata.js";
export {
  romanToDigit,
  digitToRoman,
  ROMAN_NUMERALS_TABLE,
} from "./romanNumerals.js";
