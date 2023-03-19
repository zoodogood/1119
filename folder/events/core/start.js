import { BaseEvent } from "#lib/modules/EventsManager.js";
import { assert } from 'console';
import { omit, timestampDay } from "#src/lib/util.js";

import { DataManager, TimeEventsManager, CommandsManager, CounterManager, EventsManager } from '#lib/modules/mod.js';
import { client } from '#bot/client.js';

import app from '#app';

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

		
		const needUpdate = DataManager.data.bot.currentDay !== timestampDay( Date.now() );
		if (needUpdate){
			await EventsManager.collection.get("TimeEvent/new-day")
				.run(true);

		}

		
		app.client = client;
		client.login(process.env.DISCORD_TOKEN);
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
			omit(defaultData, (k) => k in data.bot === false)
		);

		data.site ||= {};
		data.site.enterToPages ||= {_all: 0};

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