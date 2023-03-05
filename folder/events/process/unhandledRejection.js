import { BaseEvent } from "#lib/modules/EventsManager.js";
import { DataManager, TimeEventsManager, ErrorsHandler } from '#lib/modules/mod.js';


class Event extends BaseEvent {
	constructor(){
		const EVENT = "unhandledRejection";
		super(process, EVENT);
	}

	async run(error){
		ErrorsHandler.Audit.push(error);

		const ignoreMessages = [
			"Cannot execute action on a DM channel",
			"Unknown Message"
		]
		if (ignoreMessages.includes(error.message)){
			return;
		};
	}

	options = {
		name: "process/unhandledRejection"
	}
}

export default Event;