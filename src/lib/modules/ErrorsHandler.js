import { mapGetOrInsert } from "#lib/util.js";
import config from "#config";
import StorageManager from "#lib/modules/StorageManager.js";

const { stringify, parse } = JSON;

class FileMetadata {
  updateRequested = false;

  requestUpdate() {
    this.updateRequested = true;
  }
  appendCommentsCount(value) {
    this.commentsCount = value;
  }

  appendTags(tags) {
    this.uniqueTags ||= new Set();
    this.uniqueTags.add(...tags);
  }

  appendErrorsCount(value) {
    this.errorsCount = value;
  }

  appendUniqueErrors(messages) {
    this.uniqueErrors ||= new Set();
    this.uniqueErrors.add(...messages);
  }

  appendMetadata({ commentsCount, tags, errorsCount }) {
    commentsCount && this.appendCommentsCount(commentsCount);
    tags && this.appendTags(tags);
    errorsCount && this.appendErrorsCount(errorsCount);
  }
}

class GroupMetadata {
  appendComment(data) {
    this.comments ||= [];
    this.comments.push(data);
  }

  appendTags(tags) {
    this.uniqueTags ||= new Set();
    this.uniqueTags.add(...tags);
  }

  appendErrorsCount(value) {
    this.errorsCount = value;
  }

  appendMetadata({ comments, tags, errorsCount }) {
    comments && this.appendComment(comments);
    tags && this.appendTags(tags);
    errorsCount && this.appendErrorsCount(errorsCount);
  }
}

class ErrorData {
  constructor(error, context) {
    context &&= stringify(context);
    this.error = error;
    this.createdAt = Date.now();
    this.context = context ?? null;
  }

  get stack() {
    return this.error.stack;
  }

  get message() {
    return this.error.message;
  }

  get tags() {
    return Object.keys(this.context);
  }

  static from(data) {
    return Object.assign(Object.create(ErrorData.prototype), data);
  }

  static fromError(error, context) {
    new ErrorData(error, context);
  }

  static parseErrorStack({ node_modules }) {
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
}

class Group {
  constructor(key) {
    this.metadata = new GroupMetadata();
    this.errors = [];
    this.key = key;
  }

  pushError(errorData) {
    this.errors.push(errorData);
  }

  onErrorReceive(errorData) {
    this.pushError(errorData);

    this.metadata.appendMetadata({
      tags: errorData.tags,
      errorsCount: this.errors.length,
    });
  }

  addComment({ responseText, id }) {
    const meta = this.metadata;
    const comment = { responseText, id };
    meta.appendComment(comment);
  }
}

class FilesMetadataCache {
  #cache = new Map();

  async fetch(key) {
    const cache = this.#cache;
    !cache.has(key) && (await this._fetchAndSet(key));

    return cache.get(key);
  }

  async _fetchAndSet(key) {
    const json = await FileUtils.readFile(key);
    this.#cache.set(key, json.meta);
  }
}

class FileUtils {
  static normalizeName(name) {
    if (name.endsWith(".json")) {
      name = name.replace(/\.json$/, "");
    }
    return name;
  }

  static directory = `errors`;
  static async write(fileName, data) {
    const path = `${this.directory}/${fileName}.json`;

    data = stringify(data);
    await StorageManager.write(path, data);
  }

  static async readFile(file) {
    const path = `${this.directory}/${file}.json`;
    const data = await StorageManager.read(path);
    return parse(data);
  }

  static async keys() {
    const files = await StorageManager.keys(this.directory);
    const suffix = ".json";
    const filtered = files.filter((name) => name.endsWith(suffix));
    const keys = filtered.map((name) => name.replace(suffix, ""));
    return keys;
  }
}

class Core {
  /** 
   @typedef {object} ICoreStore
   @property {Map<string, Group>} errorGroups
   @property { FileMetadata } meta
  */
  /**@type {ICoreStore} */
  static session = {
    errorGroups: new Map(),
    meta: new FileMetadata(),
  };

  static updateSessionMeta() {
    const meta = this.session.meta;
    meta.appendMetadata({});
    meta.updateRequested = false;
  }

  static cache = new FilesMetadataCache();
  static filesList = [];

  static async importFileErrorsList() {
    return await FileUtils.keys();
  }

  static toJSON() {
    const { errorGroups, meta } = this.session;
    const groups = [...errorGroups.values()];
    return { groups, meta };
  }
}

class Manager {
  static Core = Core;
  static File = FileUtils;

  static session() {
    return Core.session;
  }

  static onErrorReceive(error, context) {
    const errorData = new ErrorData(error, context);
    this.pushToSessionErrors(errorData, context);
    config.development && console.error(error);

    const meta = Core.session.meta;
    meta.requestUpdate();
  }

  /**
   *
   * @param {string} key
   * @returns {Group}
   */
  static getErrorsGroupBy(key) {
    return mapGetOrInsert(Core.session.errorGroups, key, new Group(key));
  }

  static pushToSessionErrors(errorData, context) {
    const { message: key } = errorData;
    const group = this.getErrorsGroupBy(key);
    group.onErrorReceive(errorData, context);
  }

  static async sessionWriteFile() {
    const data = stringify(Core.toJSON());
    const timestamp = Date.now();
    return await FileUtils.write(timestamp, data);
  }
}

export default Manager;
export { GroupMetadata, ErrorData, Group };
export { Manager as ErrorsHandler };
