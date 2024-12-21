import EventsManager, { BaseEvent } from "#src/events/EventsManager.js";

class Event extends BaseEvent {
	options = {
		name: "process/SIGQUIT",
	};

	constructor() {
		const EVENT = "SIGQUIT";
		super(process, EVENT);
	}

	async run() {
		EventsManager.emitter.emit("beforeExit");
	}
}

export default Event;
