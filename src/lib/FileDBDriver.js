
import FileSystem from "fs/promises";

class FileDBDriver {
  static root = `${process.cwd()}/folder/!localstorage`;
  async init() {
    return this;
  }

  async writeFile(name, content) {
    const { root } = this.constructor;
    return await FileSystem.writeFile(`${root}/${name}`, content);
  }

  async readFile(name) {
    const { root } = this.constructor;
    return await FileSystem.readFile(`${root}/${name}`);
  }
}

export { FileDBDriver };
export default FileDBDriver;
