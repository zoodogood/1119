const PREFIX = "/errors/files/:name";
import ErrorsHandler from "#lib/modules/ErrorsHandler.js";
import { BaseRoute } from "#server/router.js";

class Route extends BaseRoute {
  prefix = PREFIX;

  constructor(express) {
    super();
  }

  async get(request, response) {
    const fileName = request.params.name;
    const json = await ErrorsHandler.File.readFile(fileName);
    if (!json) {
      response.sendStatus(404);
      return;
    }
    response.json(json);
  }
}

export default Route;
