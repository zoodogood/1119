const PREFIX = "/oauth2/auth";
import { APIPointAuthorizationManager } from "#lib/modules/APIPointAuthorization.js";
import { BaseRoute } from "#server/router.js";

class Route extends BaseRoute {
  prefix = PREFIX;

  constructor() {
    super();
  }

  async get(request, response) {
    const siteRedirect = request.query.redirect;
    const redirectUri = APIPointAuthorizationManager.oAuth.authorizationLink({
      state: siteRedirect,
    });

    response.redirect(redirectUri);
    return;
  }
}

export default Route;
