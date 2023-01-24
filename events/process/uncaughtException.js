import { BaseEvent } from "#src/modules/EventsManager.js";
import { DataManager, TimeEventsManager, ErrorsHandler } from '#src/modules/mod.js';


class Event extends BaseEvent {
	constructor(){
		const EVENT = "uncaughtException";
		super(process, EVENT);
	}

	async run(){
		ErrorsHandler.Audit.push(error);
    	console.error(error);
    	process.exit(1);
	}

	options = {
		name: "process/uncaughtException"
	}
}

export default Event;