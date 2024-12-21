const PREFIX = "/oauth2/callback";
import config from "#config";
import { APIPointAuthorizationManager } from "#src/auth/APIPointAuthorization/APIPointAuthorization.js";
import { ErrorsHandler } from "#src/ErrorsHandler/ErrorsHandler.js";
import { BaseRoute } from "#src/http_requests/api_router/BaseRoute.js";
import Path from "node:path";

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor() {
		super();
	}

	async get(request, response) {
		const code = request.query.code;
		const oauth = APIPointAuthorizationManager.oAuth;

		if (!oauth.clientSecret) {
			throw new Error("Accessing OAuth2 without env DISCORD_OAUTH2_TOKEN");
		}

		if (!code) {
			response.sendStatus(400);
			return;
		}
		const exchangeResponse = await oauth.requestToken(code);
		if (exchangeResponse.error) {
			ErrorsHandler.onErrorReceive(
				new Error(exchangeResponse.error_description),
				{ oauth: true },
			);
		}
		if (!exchangeResponse.access_token) {
			response.status(500).json({ exchangeResponse, status: "error", code });
			return;
		}

		const redirect = request.query.state;

		const {
			server: { origin, paths },
		} = config;
		const base = origin.concat(
			`/${Path.normalize(`${paths.site}/oauth`)}`,
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
