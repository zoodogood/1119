import EventsManager, { BaseEvent } from "#src/events/EventsManager.js";
import { timeEvents_singleton } from "./timeEvents_singleton.js";

class Event extends BaseEvent {
	options = {
		name: "timeEvents-emit",
	};

	constructor() {
		const EVENT = "timeEvent";
		super(timeEvents_singleton.emitter, EVENT);
	}

	run(event) {
		const eventBase = EventsManager.collection.get(`TimeEvent/${event.name}`);
		if (!eventBase) {
			throw new Error(`Unknown TimeEvent: ${event.name}`);
		}
		const params = event.params ?? [];
		eventBase.run(event, ...params);
	}
}

export default Event;
