import FileSystem from "fs/promises";
import Path from "path";

class FileDBDriver {
  static root = `${process.cwd()}/folder/!localstorage`;
  async init() {
    return this;
  }

  async writeFile(name, content) {
    const { root } = this.constructor;
    const path = `${root}/${name}`;
    try {
      const result = await FileSystem.writeFile(path, content);
      return result;
    } catch (error) {
      if (error.code === "ENOENT") {
        this._createDeepFolder(Path.resolve(path, ".."));
        const result = await this.writeFile(name, content);
        return result;
      }
      throw error;
    }
  }

  async readFile(name) {
    const { root } = this.constructor;
    const path = `${root}/${name}`;
    try {
      const result = await FileSystem.readFile(path);
      return result;
    } catch (error) {
      if (error.code === "ENOENT") {
        this._createDeepFolder(Path.resolve(path, "../"));
        const result = await this.readFile(name);
        return result;
      }
      throw error;
    }
  }

  async _createDeepFolder(path) {
    FileSystem.mkdir(path, { recursive: true });
  }
}

export { FileDBDriver };
export default FileDBDriver;