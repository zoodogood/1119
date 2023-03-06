
import { fetchFromInnerApi, getPackageJSON } from "#lib/safe-utils.js";

const packageJSON = await getPackageJSON();
const bot = (await fetchFromInnerApi("./client/user").catch(() => null)) ?? null;

const data = {
	bot: Object(bot).id ? bot : null,
	version: packageJSON.version,
	buildedTimestamp: Date.now()
}
export default {
	__json__: JSON.stringify(data)
}