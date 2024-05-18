import { BaseRoute } from "#server/router.js";

const PREFIX = "/utils/icons_list";

class Route extends BaseRoute {
  prefix = PREFIX;

  constructor() {
    super();
  }

  async get(request, response) {
    response.redirect("/static/resources/fonts/fontello/demo");
  }
}

export default Route;
