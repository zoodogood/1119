import StorageManager from "#lib/modules/StorageManager.js";
import { from_short, short } from "#lib/serialize/optimize_keys.js";
import EventEmitter from "events";
/**
The change log is automatically stacked based on commits.
The information of such a log should be relevant and understandable to users,
the internals of the structure can be omitted.
Commits that explicitly have a message corresponding to a regular expression will be added.
*/

const shortable_keys_table = {
  commit_id: "cid",
  message: "m",
  addable: "a",
  change: "c",
  createdAt: "t",
};

export class ChangelogDaemon {
  emitter = new EventEmitter();
  static Events = {
    beforePushHandler: "beforeCommitHandler",
    pushHandlerEnd: "commitHandlerEnd",
    changeParsed: "changeParsed",
  };
  file = {
    path: `changelog.json`,
    load: async () => {
      const path = this.file.path;
      const content = await StorageManager.read(path);
      const data =
        content && from_short(JSON.parse(content), shortable_keys_table);

      this.data = data || this.file.defaultData;
    },
    write: async () => {
      const path = this.file.path;
      const data = JSON.stringify(short(this.data, shortable_keys_table));
      await StorageManager.write(path, data);
    },
    defaultData: [],
  };
  onCommit(commit) {
    const { message, id } = commit;
    if (!message) {
      return;
    }
    const addable = message.match(/(?<=^.+?\n\s*\n)(.|\n)+/m)?.[0];

    if (!addable) {
      return;
    }
    for (const change of addable.split(/(?<=^|\n)\+/).slice(1)) {
      const data = {
        commit_id: id,
        message,
        addable,
        change: change.trim(),
        createdAt: Date.now(),
      };
      this.data.push(data);
      this.emitter.emit(ChangelogDaemon.Events.changeParsed, { data, commit });
    }
  }
  async onPush(event) {
    const { commits } = event;
    this.emitter.emit(ChangelogDaemon.Events.beforePushHandler, event);
    for (const commit of commits) {
      this.onCommit(commit);
    }
    this.emitter.emit(ChangelogDaemon.Events.pushHandlerEnd, event);
  }
}
