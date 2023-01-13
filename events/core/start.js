import { BaseEvent } from "#src/modules/EventsManager.js";
import { assert } from 'console';
import { DataManager, TimeEventsManager, CommandsManager, CounterManager, Util } from '#src/modules/mod.js';
import { client } from '#src/index.js';

class Event extends BaseEvent {
	constructor(){
		const EVENT = "start";
		super(process, EVENT);
	}

	async run(){
		await DataManager.file.load();
		await TimeEventsManager.file.load();
		// await ReactionsManager.loadReactionsFromFile();
		await CounterManager.file.load();




		await CommandsManager.importCommands();
		CommandsManager.createCallMap();



		TimeEventsManager.emitter.on("event", (event) => {
			const params = event.params ?? [];
			timeEvents[event.name].call(null, event.isLost, ...params);
		});

		TimeEventsManager.handle();

		const now = Date.now();
		DataManager.data.users.forEach(user =>
			Object.keys(user).forEach(key => key.startsWith("CD") && user[key] < now ? delete user[key] : false)
		);
		DataManager.data.users = DataManager.data.users.sort((a, b) => b.level - a.level);

		if (DataManager.data.bot.dayDate !== Util.toDayDate( now )){
			timeEvents["new_day"].call(null, true);
		}

		assert(DataManager.data.users);
		assert(DataManager.data.guilds);
		assert(DataManager.data.bot);
		const defaultData = {
			commandsUsed: {}
		}

		Object.assign(
			DataManager.data.bot, 
			Util.omit(defaultData, (k) => k in DataManager.data.bot === false)
		);

		await import('#server/start.js');
		setTimeout(() => client.login(process.env.DISCORD_TOKEN), 100);
	}

	options = {
		name: "core/start"
	}
}

export default Event;