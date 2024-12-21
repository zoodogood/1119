import config from "#config";
import { readPackageJson } from "#src/nodejs/readPackageJson.js";

class MongoDBDriver {
	async init() {
		const { MongoClient, ...mongo } = await import("mongodb");
		this.mongo = mongo;
		this.MongoClient = MongoClient;
		this.client = new MongoClient(config.database.mongoURL);
		await this.client.connect();
		const { name } = await readPackageJson();
		this.db = this.client.db(name);
		this.files = this.db.collection("files");

		return this;
	}

	async keys(path) {
		this.files.listIndexes();
	}

	async readFile(name) {
		return await this.files.findOne({ name });
	}

	async writeFile(name, content) {
		const options = { upsert: true };
		return await this.files.updateOne(
			{ name },
			{ $set: { name, content } },
			options,
		);
	}
}

export { MongoDBDriver };
export default MongoDBDriver;
