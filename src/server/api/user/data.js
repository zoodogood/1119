import { authorizationProtocol } from "#lib/modules/APIPointAuthorization.js";
import { BaseRoute } from "#server/router.js";
const PREFIX = "/user/data";

class Route extends BaseRoute {
  isSimple = false;

  prefix = PREFIX;
  constructor() {
    super();
  }

  async get(request, response) {
    const { user } = await authorizationProtocol(request, response);
    if (!user) {
      return;
    }

    response.json(user.data);
  }
}

export default Route;
