import StorageManager from "#lib/modules/StorageManager.js";
/**
The change log is automatically stacked based on commits.
The information of such a log should be relevant and understandable to users,
the internals of the structure can be omitted.
Commits that explicitly have a message corresponding to a regular expression will be added.
*/

export class ChangelogDaemon {
  file = {
    path: `changelog.json`,
    load: async () => {
      const path = this.file.path;
      const content = await StorageManager.read(path);
      const data = content && JSON.parse(content);
      this.data = data || this.file.defaultData;
    },
    write: async () => {
      const path = this.file.path;
      const data = JSON.stringify(this.data);
      await StorageManager.write(path, data);
    },
    defaultData: [],
  };

  onCommit(event) {
    this.data.push(event);
  }
}
