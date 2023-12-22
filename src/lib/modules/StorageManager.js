class StorageManager {
  static async setDriver(driverId) {
    const module = await (() => {
      switch (driverId) {
        case "localdb":
          return import("#lib/FileDBDriver.js");
        case "mongodb":
          return import("#lib/MongoDBDriver.js");
        default:
          throw new Error(
            "Maybe. Storage manager driver not selected in config file at database.driver; Incorrect driverId",
          );
      }
    })();

    this.driver = new module.default();

    await this.driver.init();
  }

  static async write(name, content) {
    return await this.driver.writeFile(name, content);
  }
  static async read(name) {
    return await this.driver.readFile(name);
  }
  static async keys() {
    return await this.driver.keys();
  }
}

export default StorageManager;
