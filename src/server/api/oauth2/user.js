const PREFIX = "/oauth2/user";
import { TokensUsersExchanger } from "#lib/modules/APIPointAuthorization.js";
import { BaseRoute } from "#server/router.js";

class Route extends BaseRoute {
  prefix = PREFIX;

  constructor(express) {
    super();
  }

  async get(request, response) {
    const token = request.headers.authorization;
    if (!token) {
      response.status(401).send(`"Not authorized"`);
      return;
    }

    const prepareGuilds = !!request.headers.guilds;

    const user = await TokensUsersExchanger.getUserRaw(token, {
      requireOAuth: true,
      prepareGuilds,
    });
    if (user === null) {
      response.status(401).send(`"Authorization failed"`);
      return;
    }

    response.json(user);
  }
}

export default Route;
export { TokensUsersExchanger };
