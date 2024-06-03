import { client } from "#bot/client.js";

class Event {
  options = {
    name: "TimeEvent/cooled-bot",
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
