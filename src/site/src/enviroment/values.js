import { readFileSync } from "fs";
import { fetchFromInnerApi } from "#lib/safe-utils.js";

const packageJSON = JSON.parse(readFileSync(`${ process.cwd() }/package.json`));

const bot = (await fetchFromInnerApi("./client/user")) ?? null;

const data = {
	bot: Object(bot).id ? bot : null,
	version: packageJSON.version,
	buildedTimestamp: Date.now()
}
export default {
	__json__: JSON.stringify(data)
}