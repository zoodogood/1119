import { BaseRoute } from "#src/http_requests/api_router/BaseRoute.js";

const PREFIX = "/modules/changelog_daemon/changelog";

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor() {
		super();
	}

	async get(request, response) {
		response.json(ChangelogDaemon.data);
	}
}

export default Route;
