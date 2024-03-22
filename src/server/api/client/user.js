import { BaseRoute } from "#server/router.js";
import client from "#bot/client.js";
import { generateInviteFor } from "#lib/util.js";

const PREFIX = "/client/user";

class Route extends BaseRoute {
  prefix = PREFIX;

  constructor(express) {
    super();
  }

  async get(request, response) {
    const invite = generateInviteFor(client);
    const displayAvatarURL = client.user.displayAvatarURL();
    const data = { ...client.user, displayAvatarURL, invite };
    response.json(data);
  }
}

export default Route;
