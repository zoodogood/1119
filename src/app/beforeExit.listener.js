import { Events } from "#src/app/events.enum.js";
import client from "#src/bot/client/singleton.js";
import { createStopPromise } from "#src/createStopPromise.js";
import { DataManager } from "#src/data/singleton.js";
import ErrorsHandler from "#src/ErrorsHandler/ErrorsHandler.js";
import EventsManager, { BaseEvent } from "#src/events/EventsManager.js";
import { timeEvents_singleton } from "#src/events/time/timeEvents_singleton.js";

import { ActivityType } from "discord.js";

class Event extends BaseEvent {
	options = {
		name: "process/beforeExit",
		once: true,
	};

	constructor() {
		const EVENT = "beforeExit";
		super(EventsManager.emitter, EVENT);
	}

	async run() {
		console.info("Before Exit: start");
		try {
			client.user?.setActivity("Перезапускаюсь", {
				type: ActivityType.Streaming,
				url: "https://www.twitch.tv/monstercat",
			});

			const saveEvent = {
				...createStopPromise(),
			};
			EventsManager.emitter.emit(Events.RequestSave, saveEvent);
			await saveEvent.whenStopPromises();
			await DataManager.file.write();
			await timeEvents_singleton.file.write();
			if (ErrorsHandler.session().errorGroups.size > 0) {
				await ErrorsHandler.sessionWriteFile();
			}
			console.info("Before exit: success");
		} catch (error) {
			console.error(error);
		}

		process.exit();
	}
}

export default Event;
