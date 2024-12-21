import { client } from "#src/bot/client/singleton.js";

class Event {
	options = {
		name: "timeEvent/cooled-bot",
	};

	run(eventData, guildId) {
		const guild = client.guilds.cache.get(guildId);
		if (!guild) {
			return;
		}
		delete guild.data.stupid_evil;
	}
}

export default Event;
