import config from "#config";
import { ReadPackageJson } from "#lib/util.js";

class MongoDBDriver {
  async init() {
    const { MongoClient, ...mongo } = await import("mongodb");
    this.mongo = mongo;
    this.MongoClient = MongoClient;
    this.client = new MongoClient(config.database.mongoURL);
    const { name } = await ReadPackageJson();
    this.db = this.client.db(name);
    this.files = this.db.collection("files");

    return this;
  }

  async writeFile(name, content) {
    const options = { upsert: true };
    return await this.files.updateOne(
      { name },
      { $set: { name, content } },
      options,
    );
  }

  async readFile(name) {
    return await this.files.findOne({ name });
  }
}

export { MongoDBDriver };
export default MongoDBDriver;