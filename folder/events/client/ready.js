import { BaseEvent } from "#lib/modules/EventsManager.js";
import { CounterManager } from '#lib/modules/mod.js';
import { client } from '#bot/client.js';

class Event extends BaseEvent {
	constructor(){
		const EVENT = "ready";
		super(client, EVENT);
	}

	async run(){
		CounterManager.handle();
	}

	options = {
		name: "client/ready"
	}
}

export default Event;