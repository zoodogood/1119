import client from "#src/bot/client/singleton.js";

import { BaseEvent } from "#src/events/EventsManager.js";
import { onMessageDelete as ChainLifecycleOnMessageDelete } from "@zoodogood/utils/discordjs";
import { Events } from "discord.js";

class Event extends BaseEvent {
	options = {
		name: "client/messageDelete",
	};

	constructor() {
		const EVENT = Events.MessageDelete;
		super(client, EVENT);
	}

	async run(message) {
		ChainLifecycleOnMessageDelete(message);
	}
}

export default Event;
