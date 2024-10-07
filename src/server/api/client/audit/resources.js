import { DataManager } from "#lib/DataManager/singletone.js";
import { BaseRoute } from "#server/router.js";

const PREFIX = "/client/audit/resources";

class Route extends BaseRoute {
  prefix = PREFIX;

  constructor(express) {
    super();
  }

  async get(request, response) {
    response.json(DataManager.data.audit.resourcesChanges);
    return;
  }
}

export default Route;
