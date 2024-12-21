import EventsManager, { BaseEvent } from "#src/events/EventsManager.js";

class Event extends BaseEvent {
	options = {
		name: "process/SIGUSR1",
	};

	constructor() {
		const EVENT = "SIGUSR1";
		super(process, EVENT);
	}

	async run() {
		EventsManager.emitter.emit("beforeExit");
	}
}

export default Event;
