import ErrorsHandler from "#src/ErrorsHandler/ErrorsHandler.js";
import { BaseEvent } from "#src/events/EventsManager.js";

class Event extends BaseEvent {
	options = {
		name: "process/unhandledRejection",
	};

	constructor() {
		const EVENT = "unhandledRejection";
		super(process, EVENT);
	}

	async run(error) {
		const ignoreMessages = [
			"Cannot execute action on a DM channel",
			"Unknown Message",
			"Missing Permissions",
		];
		if (ignoreMessages.includes(error.message)) {
			return;
		}

		ErrorsHandler.onErrorReceive(error, { uncaughtException: true });
	}
}

export default Event;
