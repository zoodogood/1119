import { BaseRoute } from "#server/router.js";

const PREFIX = "/.well-known/pki-validation/<secret>.txt";

class Route extends BaseRoute {
  isHidden = true;
  prefix = PREFIX;

  constructor(express) {
    super();
  }

  async get(request, response) {
    response.json(`<Спрятано>`);
  }
}

export default Route;
