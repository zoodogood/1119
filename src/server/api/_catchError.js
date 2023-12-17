import ErrorsHandler from "#src/lib/modules/ErrorsHandler.js";
import { sleep } from "#lib/util.js";
import { BaseRoute } from "#server/router.js";

const PREFIX = "/";

class Route extends BaseRoute {
  constructor(express) {
    super();

    this.start();
    this.express = express;
  }

  async catch(error, request, response, next) {
    ErrorsHandler.Audit.push(error, {
      path: request.originalUrl,
      source: "API",
    });
    response.status(500);
    response.json(
      `Ошибка сервера переданная от сервера: "${error.message}". Информация об ошибке записана и может быть найдена по адресу /pages/errors/select`,
    );
  }

  async start() {
    await sleep(1);
    this.express.use(PREFIX, this.catch);
  }
}

export default Route;
