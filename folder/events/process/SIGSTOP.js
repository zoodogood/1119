import { BaseEvent } from "#lib/modules/EventsManager.js";
import { DataManager, TimeEventsManager, ErrorsHandler } from '#lib/modules/mod.js';


class Event extends BaseEvent {
	constructor(){
		const EVENT = "SIGSTOP";
		super(process, EVENT);
	}

	async run(){
		process.emit("exit");
		process.exit(1);
	}

	options = {
		name: "process/SIGSTOP"
	}
}

export default Event;