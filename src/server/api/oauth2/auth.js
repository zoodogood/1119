const PREFIX = "/oauth2/auth";
import { APIPointAuthorizationManager } from "#lib/modules/APIPointAuthorization.js";
import { BaseRoute } from "#server/router.js";

class Route extends BaseRoute {
  prefix = PREFIX;

  constructor(express) {
    super();
  }

  async get(request, response) {
    const siteRedirect = request.query.redirect;
    const redirectURL = APIPointAuthorizationManager.oAuth.generateAuthUrl({
      state: siteRedirect,
      scope: ["identify", "guilds"],
    });

    response.redirect(redirectURL);
    return;
  }
}

export default Route;
