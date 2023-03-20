import { BaseEvent } from "#lib/modules/EventsManager.js";
import { DataManager, TimeEventsManager, ErrorsHandler } from '#lib/modules/mod.js';


class Event extends BaseEvent {
	constructor(){
		const EVENT = "exit";
		super(process, EVENT);
	}

	async run(){
		console.info("\n   ЗАВЕРШЕНИЕ...\n");
		DataManager.file.write();
		TimeEventsManager.file.write();
		ErrorsHandler.Audit.createLog();
	}

	options = {
		name: "process/exit",
		once: true
	}
}

export default Event;