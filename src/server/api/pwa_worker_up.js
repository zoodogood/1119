import { BaseRoute } from "#server/router.js";

const PREFIX = "/pwa_worker_up";

import Path from "path";

const ROOT = "static";
const root = Path.join(process.cwd(), ROOT);
const target = "service_worker.js";

class Route extends BaseRoute {
  prefix = PREFIX;

  constructor() {
    super();
  }

  async get(request, response) {
    const targetPath = Path.join(root, target);
    response.sendFile(targetPath);
  }
}

export default Route;
