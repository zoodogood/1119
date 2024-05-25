import StorageManager from "#lib/modules/StorageManager.js";
import { sendErrorInfo } from "#lib/sendErrorInfo.js";
import { dayjs, mapGetOrInsert } from "#lib/util.js";

const { stringify, parse } = JSON;

class Metadata {
  #updateRequested = false;

  static defaults = {};

  constructor() {
    const { defaults } = this.constructor;
    Object.assign(this, defaults);
  }

  appendMetadata() {
    throw new Error("Must be implemented");
  }

  static from(props) {
    return Object.assign(Object.create(this.prototype), props);
  }

  requestUpdate() {
    this.#updateRequested = true;
  }
  get updateRequested() {
    return this.#updateRequested;
  }

  set updateRequested(value) {
    this.#updateRequested = value;
  }
}

class SessionMetadata extends Metadata {
  static defaults = {
    commentsCount: null,
    uniqueTags: new Set(),
    errorsCount: null,
    uniqueErrors: new Set(),
  };

  appendCommentsCount(value) {
    this.commentsCount = value;
  }

  appendErrorsCount(value) {
    this.errorsCount = value;
  }

  appendMetadata({ commentsCount, uniqueTags, errorsCount, uniqueErrors }) {
    commentsCount && this.appendCommentsCount(commentsCount);
    uniqueTags && this.appendTags(uniqueTags);
    errorsCount && this.appendErrorsCount(errorsCount);
    uniqueErrors && this.appendUniqueErrors(uniqueErrors);
  }

  appendTags(uniqueTags) {
    for (const tag of uniqueTags) {
      this.uniqueTags.add(tag);
    }
  }

  appendUniqueErrors(messages) {
    for (const message of messages) {
      this.uniqueErrors.add(message);
    }
  }
}

class GroupMetadata extends Metadata {
  appendComment(data) {
    this.comments ||= [];
    this.comments.push(data);
  }

  appendErrorsCount(value) {
    this.errorsCount = value;
  }

  appendMetadata({ comments, tags, errorsCount }) {
    comments && this.appendComment(comments);
    tags && this.appendTags(tags);
    errorsCount && this.appendErrorsCount(errorsCount);
  }

  appendTags(tags) {
    this.uniqueTags ||= new Set();
    for (const tag of tags) {
      this.uniqueTags.add(tag);
    }
  }
}

class ErrorData {
  constructor(error, context) {
    this.tags = Object.keys(context ?? {});
    context &&= stringify(context);
    this.error = error;
    try {
      this.stackData = this.parseErrorStack();
    } catch (error) {
      console.error(error);
    }
    this.createdAt = Date.now();
    this.context = context ?? null;
  }

  static from(data) {
    return Object.assign(Object.create(ErrorData.prototype), data);
  }

  static fromError(error, context) {
    new ErrorData(error, context);
  }

  get message() {
    return this.error.message;
  }

  parseErrorStack({ node_modules } = {}) {
    let stack = this.error.stack;
    try {
      stack = decodeURI(stack).replaceAll("\\", "/");
    } catch (error) {
      stack = `!decodeError of stack\n${stack}`;
    }

    stack ||= "null";
    const projectPath = process.cwd().replaceAll("\\", "/");
    const regular = new RegExp(
      `(?<fileOfError>${projectPath}/.+?\\.js):(?<strokeOfError>\\d+)`,
    );
    const groups = stack.match(regular)?.groups;
    if (!groups) {
      return undefined;
    }
    const { fileOfError } = groups;
    if (node_modules === false && fileOfError.includes("node_modules")) {
      return null;
    }
    return { ...groups, stack };
  }

  get stack() {
    return this.error.stack;
  }
}

class Group {
  constructor(key) {
    this.meta = new GroupMetadata();
    this.errors = [];
    this.key = key;
  }

  addComment({ responseText, id }) {
    const meta = this.meta;
    const comment = { responseText, id };
    meta.appendComment(comment);
  }

  onErrorReceive(errorData) {
    this.pushError(errorData);

    this.meta.appendMetadata({
      tags: errorData.tags,
      errorsCount: this.errors.length,
    });
  }

  pushError(errorData) {
    this.errors.push(errorData);
  }
}

class SessionsMetadataCache {
  #cache = new Map();

  async _fetchAndSet(key) {
    const json = await FileUtils.readFile(key);
    this.#cache.set(key, json?.meta);
  }

  async fetch(key) {
    const cache = this.#cache;
    !cache.has(key) && (await this._fetchAndSet(key));

    return cache.get(key);
  }
}

class FileUtils {
  static directory = `errors`;

  static async keys() {
    const files = await StorageManager.keys(this.directory);
    const suffix = ".json";
    const filtered = files.filter((name) => name.endsWith(suffix));
    const keys = filtered.map((name) => name.replace(suffix, ""));
    return keys;
  }
  static normalizeName(name) {
    if (name.endsWith(".json")) {
      name = name.replace(/\.json$/, "");
    }
    return name;
  }

  static async readFile(file) {
    const path = `${this.directory}/${file}.json`;
    const data = await StorageManager.read(path);
    return parse(data);
  }

  static async write(fileName, data) {
    const path = `${this.directory}/${fileName}.json`;

    data = stringify(data);
    await StorageManager.write(path, data);
  }
}

class Core {
  /** 
   @typedef {object} ICoreStore
   @property {Map<string, Group>} errorGroups
   @property { SessionMetadata } meta
  */
  static cache = new SessionsMetadataCache();

  static filesList = [];

  /**@type {ICoreStore} */
  static session = {
    errorGroups: new Map(),
    meta: new SessionMetadata(),
  };
  static toJSON() {
    const { errorGroups, meta } = this.session;
    const groups = [...errorGroups.values()];
    return { groups, meta };
  }

  static updateSessionMetadata({ force = false } = {}) {
    const { errorGroups, meta } = this.session;
    if (!force && !meta.updateRequested) {
      return;
    }

    const groups = [...errorGroups.values()];
    meta.appendMetadata({
      uniqueTags: groups.reduce(
        (acc, { meta }) => (acc.push(...meta.uniqueTags), acc),
        [],
      ),
      commentsCount: groups.reduce(
        (acc, { meta }) => acc + (meta.comments?.length ?? 0),
        0,
      ),
      errorsCount: groups.reduce((acc, { errors }) => acc + errors.length, 0),
      uniqueErrors: [...errorGroups.keys()],
    });
    meta.updateRequested = false;
  }
}

class Manager {
  static Core = Core;
  static File = FileUtils;

  static actualSessionMetadata() {
    Core.updateSessionMetadata();
    return Core.session.meta;
  }

  static errorLogger(error) {
    console.error(`[${dayjs().format("HH:mm")}]`, error);
  }

  static async fetchManyMetadata() {
    const current = this.actualSessionMetadata();
    const cache = [
      ...(
        await Promise.all(Core.filesList.map((key) => Core.cache.fetch(key)))
      ).values(),
    ];
    return { current, cache };
  }

  /**
   *
   * @param {string} key
   * @returns {Group}
   */
  static getErrorsGroupBy(key) {
    return mapGetOrInsert(Core.session.errorGroups, key, new Group(key));
  }

  static async importFileErrorsList() {
    const keys = (await FileUtils.keys()).filter(
      (key) => !Core.filesList.includes(key),
    );
    Core.filesList.push(...keys);
    return Core.filesList;
  }

  static onErrorReceive(error, context) {
    try {
      const errorData = new ErrorData(error, context);
      this.pushToSessionErrors(errorData, context);
      this.errorLogger(error);

      const meta = Core.session.meta;
      meta.requestUpdate();
    } catch (error) {
      console.error(error);
      process.exit();
    }
  }

  static pushToSessionErrors(errorData, context) {
    const { message: key } = errorData;
    const group = this.getErrorsGroupBy(key);
    group.onErrorReceive(errorData, context);
  }

  static session() {
    return Core.session;
  }

  static async sessionWriteFile() {
    Core.updateSessionMetadata();
    const data = Core.toJSON();
    const timestamp = Date.now();
    return await FileUtils.write(timestamp, data);
  }
}

export function util_store_and_send_audit(context, error) {
  const { channel, interaction } = context;
  const primary = context.getSafeJSON?.() || null;
  Manager.onErrorReceive(error, primary);
  sendErrorInfo({ channel, interaction, error, primary });
}

export default Manager;
export { ErrorData, Manager as ErrorsHandler, Group, GroupMetadata };
