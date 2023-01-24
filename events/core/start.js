import { BaseEvent } from "#src/modules/EventsManager.js";
import { assert } from 'console';
import { DataManager, TimeEventsManager, CommandsManager, CounterManager, Util, EventsManager } from '#src/modules/mod.js';
import { client } from '#src/index.js';
import app from '#src/modules/app.js';

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

		this.checkDataManagerFullset();
		const now = Date.now();


		await CommandsManager.importCommands();
		CommandsManager.createCallMap();



		TimeEventsManager.handle();

		

		if (DataManager.data.bot.dayDate !== Util.toDayDate( now )){
			EventsManager.collection.get("TimeEvent/day-stats")
				.run(true);
		}

		

		const {default: server} = await import('#server/start.js');

		app.server = server;
		setTimeout(() => client.login(process.env.DISCORD_TOKEN), 100);
	}

	checkDataManagerFullset(){
		const data = DataManager.data;

		assert(data.users);
		assert(data.guilds);
		assert(data.bot);
		const defaultData = {
			commandsUsed: {}
		}

		Object.assign(
			data.bot, 
			Util.omit(defaultData, (k) => k in data.bot === false)
		);

		const now = Date.now();
		data.users.forEach(user =>
			Object.keys(user).forEach(key => key.startsWith("CD") && user[key] < now ? delete user[key] : false)
		);
		data.users = data.users.sort((a, b) => b.level - a.level);

		data.bot.berrysPrise ||= 200;
		data.bot.grempen ||= "123456";
	}

	options = {
		name: "core/start"
	}
}

export default Event;