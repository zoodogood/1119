import { assert } from "#src/assert/export.js";
import { omit } from "@zoodogood/utils/objectives";
import { default as DataManager } from "./DataManager.js";
import { Store } from "./Store.js";
const store = new Store();

await DataManager.require_load();

const { data: Data } = DataManager;
assert(Data.users);
assert(Data.guilds);
assert(Data.bot);
const defaultData = {
	commandsUsed: {},
};

Object.assign(
	Data.bot,
	omit(defaultData, (k) => k in Data.bot === false),
);

Data.bot.messagesToday ||= 0;

Data.site ||= {};
Data.site.enterToPages ||= {};
Data.site.entersToPages ||= 0;
Data.site.entersToPagesToday ||= 0;
Data.site.enterToAPI ||= {};
Data.site.entersToAPI ||= 0;
Data.site.entersToAPIToday ||= 0;
Data.bot.bossDamageToday ||= 0;

Data.audit ||= {};
Data.audit.daily ||= {};
Data.audit.resourcesChanges ||= {};
Data.audit.actions ||= {};

const now = Date.now();
Data.users.forEach((userData) =>
	Object.keys(userData).forEach((key) =>
		key.startsWith("CD") && userData[key] < now ? delete userData[key] : false,
	),
);
Data.guilds.forEach((guildData) => {
	delete guildData.stupid_evil;
});
Data.users = Data.users.sort((a, b) => b.level - a.level);

Data.bot.berrysPrice ||= 200;
Data.bot.grempenItems ||= "123456";
export { DataManager, store };
