import { parse_body } from "#lib/express_utils.js";
import EventsManager from "#lib/modules/EventsManager.js";
import { BaseRoute } from "#server/router.js";

const PREFIX = "/accept_github_webhook";

export const Events = {
  Commit: "accept_github_webhook__Commit",
};
class Route extends BaseRoute {
  isHidden = true;
  prefix = PREFIX;

  constructor() {
    super();
  }

  async post(request, response) {
    await parse_body(request, response, { method: "json" });
    response.sendStatus(202);

    EventsManager.emitter.emit(Events.Commit, request.body);
  }
}

export default Route;
