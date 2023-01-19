import { BaseEvent } from "#src/modules/EventsManager.js";
import { assert } from 'console';
import { DataManager, TimeEventsManager, CommandsManager, CounterManager, Util, EventsManager } from '#src/modules/mod.js';
import { client } from '#src/index.js';

class Event extends BaseEvent {
	constructor(){
		const EVENT = "start";
		super(process, EVENT);
	}

	async run(){
		EventsManager.listenAll();

		await DataManager.file.load();
		await TimeEventsManager.file.load();
		// await ReactionsManager.loadReactionsFromFile();
		await CounterManager.file.load();

		
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

		const now = Date.now();
		DataManager.data.users.forEach(user =>
			Object.keys(user).forEach(key => key.startsWith("CD") && user[key] < now ? delete user[key] : false)
		);
		DataManager.data.users = DataManager.data.users.sort((a, b) => b.level - a.level);

		


		await CommandsManager.importCommands();
		CommandsManager.createCallMap();



		TimeEventsManager.handle();

		

		if (DataManager.data.bot.dayDate !== Util.toDayDate( now )){
			EventsManager.collection.get("TimeEvent/day-stats")
				.run(true);
		}

		

		await import('#server/start.js');
		setTimeout(() => client.login(process.env.DISCORD_TOKEN), 100);
	}

	options = {
		name: "core/start"
	}
}

export default Event;