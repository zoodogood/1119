import { sleep } from "#lib/util.js";
import { BaseRoute } from "#server/router.js";

class Route extends BaseRoute {
  constructor(express) {
    super();

    this.start();
    this.express = express;
  }

  async catch(request, response) {
    response.status(404);
    response.send("404");
  }

  async start() {
    await sleep(1);
    this.express.use(this.catch);
  }
}

export default Route;
