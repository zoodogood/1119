import { BaseRoute } from "#server/router.js";
import client from "#bot/client.js";
import CommandsManager from "#lib/modules/CommandsManager.js";

const PREFIX = "/client/statistic/general";

class Route extends BaseRoute {
  prefix = PREFIX;

  constructor(express) {
    super();
  }

  async get(request, response) {
    const data = {
      guilds: client.guilds.cache.size,
      users: client.users.cache.size,
      channels: client.channels.cache.size,
      commands: CommandsManager.collection.size,
    };
    response.json(data);
  }
}

export default Route;
