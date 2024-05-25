import { parse_body } from "#lib/express_utils.js";
import { ErrorsHandler } from "#lib/modules/ErrorsHandler.js";
import { BaseRoute } from "#server/router.js";

const PREFIX = "/toys/throw";

class Route extends BaseRoute {
  prefix = PREFIX;

  constructor(express) {
    super();
  }

  async get(request, response, next) {
    throw new Error(
      "Error caused automatically from toy api point: Need more coffe",
    );
  }

  async post(request, response, next) {
    const data = JSON.parse(await parse_body(request));
    const { message, stack } = data;
    const error = new Error(message);
    error.stack = stack;
    ErrorsHandler.onErrorReceive(error, { type: "site" });
  }
}

export default Route;
