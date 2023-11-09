import { client } from "#bot/client.js";

class Event {
  run(isLost, guildId) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return;
    }
    delete guild.data.stupid_evil;
  }

  options = {
    name: "TimeEvent/cooled-bot",
  };
}

export default Event;
