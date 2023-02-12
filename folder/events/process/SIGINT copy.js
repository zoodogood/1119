import { BaseEvent } from "#src/modules/EventsManager.js";
import { DataManager, TimeEventsManager, ErrorsHandler } from '#src/modules/mod.js';


class Event extends BaseEvent {
	constructor(){
		const EVENT = "SIGINT";
		super(process, EVENT);
	}

	async run(){
		process.exit(1);
	}

	options = {
		name: "process/SIGINT"
	}
}

export default Event;