import { ChestManager } from "#folder/commands/chest.js";
import { authorizationProtocol } from "#lib/modules/APIPointAuthorization.js";
import { BaseRoute } from "#server/router.js";
const PREFIX = "/user/chest_open";

class Route extends BaseRoute {
  prefix = PREFIX;

  constructor() {
    super();
  }

  async post(request, response) {
    const { user } = await authorizationProtocol(request, response);
    if (!user) {
      return;
    }

    const cooldown = ChestManager.cooldown.for(user.data);

    if (cooldown.checkYet()) {
      response
        .status(405)
        .json({ notAllowed: "cooldown", value: cooldown.diff() });
      return;
    }

    const resources = ChestManager.open({
      user,
      context: { request, response },
    });
    cooldown.install();
    response.json(resources);
  }
}

export default Route;
