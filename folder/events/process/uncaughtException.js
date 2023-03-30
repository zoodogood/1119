import { BaseEvent } from "#lib/modules/EventsManager.js";
import { DataManager, TimeEventsManager, ErrorsHandler } from '#lib/modules/mod.js';


class Event extends BaseEvent {
	constructor(){
		const EVENT = "uncaughtException";
		super(process, EVENT);
	}

	async run(error){
		ErrorsHandler.Audit.push(error, {uncaughtException: true});
    	process.exit(1);
	}

	options = {
		name: "process/uncaughtException"
	}
}

export default Event;