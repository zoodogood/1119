import config from "#config";
import { MINUTE } from "#constants/time.js";
import { Events } from "#src/app/events.enum.js";
import { createStopPromise } from "#src/createStopPromise.js";
import { DataManager } from "#src/data/singleton.js";
import EventsManager from "#src/events/EventsManager.js";
import { timeEvents_singleton } from "#src/events/time/timeEvents_singleton.js";

class Event {
	static INTERVAL = MINUTE * 5;

	options = {
		name: "timeEvent/autosave",
	};

	async run() {
		if (config.development) {
			return;
		}
		DataManager.file.write();
		timeEvents_singleton.file.write();
		const saveEvent = {
			...createStopPromise(),
		};
		EventsManager.emitter.emit(Events.RequestSave, saveEvent);
		await saveEvent.whenStopPromises();
		return timeEvents_singleton.pushIntoBuffer("autosave", Event.INTERVAL);
	}
}

export default Event;
