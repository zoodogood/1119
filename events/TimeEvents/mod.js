import { BaseEvent } from '#src/modules/EventsManager.js';
import TimeEventsManager from '#src/modules/TimeEventsManager.js';
import EventsManager from '#src/modules/EventsManager.js';


class Event extends BaseEvent {
	constructor(){
		const EVENT = "event";
		super(TimeEventsManager.emitter, EVENT);
	}

	run(event){
		const eventBase = EventsManager.collection.get(`TimeEvent/${ event.name }`);
		if (!eventBase){
			throw new Error(`Unknow TimeEvent: ${ event.name }`)
		}
		const params = event.params ?? [];
		eventBase.run(event.isLost, ...params);
	}

	options = {
		name: "TimeEventManager-emit"
	}
}

export default Event;