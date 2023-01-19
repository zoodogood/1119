import { BaseEvent } from "#src/modules/EventsManager.js";
import { CounterManager } from '#src/modules/mod.js';
import { client } from '#src/index.js';

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