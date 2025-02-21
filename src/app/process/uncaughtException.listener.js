import config from "#config";
import client from "#src/bot/client/singleton.js";
import { pushMessage } from "#src/discord/pushMessage.js";
import ErrorsHandler from "#src/ErrorsHandler/ErrorsHandler.js";
import EventsManager, { BaseEvent } from "#src/events/EventsManager.js";

class Event extends BaseEvent {
	options = {
		name: "process/uncaughtException",
	};

	constructor() {
		const EVENT = "uncaughtException";
		super(process, EVENT);
	}

	async run(error) {
		ErrorsHandler.onErrorReceive(error, {
			uncaughtException: true,
			emitExit: true,
		});
		try {
			const channel = client.channels.cache.get(config.guild.logChannelId);
			channel &&
				pushMessage(channel, {
					content: "Бот был перезапущен после необработанной ошибки",
					description: `message: ${error.message},\nkey: \`${Date.now()}\``,
				});
		} catch (error) {
			console.error(error);
		}
		console.error(error);
		EventsManager.emitter.emit("beforeExit");
	}
}

export default Event;
