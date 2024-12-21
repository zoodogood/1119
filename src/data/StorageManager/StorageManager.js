import config from "#config";

class StorageManager {
	static async keys(path) {
		return await this.driver.keys(path);
	}

	static async read(name) {
		return await this.driver.readFile(name);
	}
	static async setDriver(driverId) {
		const module = await (() => {
			switch (driverId) {
				case "localdb":
					return import(
						"#src/data/StorageManager/drivers/FileDBDriver.js"
					);
				case "mongodb":
					return import(
						"#src/data/StorageManager/drivers/MongoDBDriver.js"
					);
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
}

await StorageManager.setDriver(config.database.driver);

export default StorageManager;
