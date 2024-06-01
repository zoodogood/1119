const PREFIX = "/oauth2/callback";
import config from "#config";
import { APIPointAuthorizationManager } from "#lib/modules/APIPointAuthorization.js";
import { BaseRoute } from "#server/router.js";
import PagesRouter from "#site/lib/Router.js";
import Path from "path";

class Route extends BaseRoute {
  prefix = PREFIX;

  constructor(express) {
    super();
  }

  async get(request, response) {
    const code = request.query.code;
    const oauth = APIPointAuthorizationManager.OAuth;

    if (!oauth.clientSecret) {
      throw new Error("Accessing OAuth2 without DISCORD_OAUTH2_TOKEN");
    }

    if (!code) {
      response.sendStatus(400);
      return;
    }
    const exchangeResponse = await oauth.getOAuth2Data(code);
    if (!exchangeResponse.access_token) {
      response.status(500).json(exchangeResponse);
      return;
    }

    const redirect = request.query.state;

    const {
      server: { origin, paths },
    } = config;
    const base = origin.concat(
      `/${Path.normalize(`${paths.site}/${PagesRouter.getPageBy("oauth/index").key}`)}`,
    );

    const queries = new URLSearchParams({
      code: exchangeResponse.access_token,
      redirect,
    }).toString();

    const url = `${base}?${queries}`.replaceAll("\\", "/");
    response.redirect(url);
  }
}

export default Route;
