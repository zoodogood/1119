import { authorizationProtocol } from "#src/auth/APIPointAuthorization/APIPointAuthorization.js";
import { ChangelogDaemon } from "#src/bot/ChangelogDaemon/ChangelogDaemon.js";
import { parse_body } from "#src/http_requests/express_utils.js";

import { BaseRoute } from "#src/http_requests/api_router/BaseRoute.js";

const PREFIX = "/modules/changelog_daemon/request_edit_change";

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor() {
		super();
	}

	async post(request, response) {
		const { user } = await authorizationProtocol(request, response);

		if (!user) {
			return;
		}

		const body = await parse_body(request);
		const { target, value } = JSON.parse(body);

		const item = ChangelogDaemon.data.find(({ uid }) => uid === target);

		if (!item) {
			response
				.status(404)
				.send(`change not found to be edited uid = "${target}"`);
			return;
		}

		item.change = value;
		response.status(200).send("ok");
	}
}

export default Route;
