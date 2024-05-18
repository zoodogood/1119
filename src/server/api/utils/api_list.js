import app from "#app";
import { BaseRoute } from "#server/router.js";

const PREFIX = "/utils/api_list";

class Route extends BaseRoute {
  prefix = PREFIX;

  constructor() {
    super();
  }

  async get(request, response) {
    const router = app.server.router;
    const data = router.getParsedRoutesList();
    response.json(data);
  }
}

export default Route;
