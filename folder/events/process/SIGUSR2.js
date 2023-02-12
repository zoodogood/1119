import { BaseEvent } from "#src/modules/EventsManager.js";
import { DataManager, TimeEventsManager, ErrorsHandler } from '#src/modules/mod.js';


class Event extends BaseEvent {
	constructor(){
		const EVENT = "SIGUSR2";
		super(process, EVENT);
	}

	async run(){
		process.exit(1);
	}

	options = {
		name: "process/SIGUSR2"
	}
}

export default Event;