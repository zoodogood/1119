import { ChangelogDaemon } from "#lib/modules/mod.js";
import { BaseRoute } from "#server/router.js";

const PREFIX = "/modules/changelog_daemon/changelog";

class Route extends BaseRoute {
  prefix = PREFIX;

  constructor() {
    super();
  }

  async get(request, response) {
    response.json(ChangelogDaemon.data);
  }
}

export default Route;
