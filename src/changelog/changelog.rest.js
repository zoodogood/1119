import { BaseRoute } from "#src/http_requests/api_router/BaseRoute.js";
import { singleton } from "./ChangelogDaemon/singleton.js";

const PREFIX = "/changelog";

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor() {
		super();
	}

	async get(request, response) {
		response.json(singleton.data);
	}
}

export default Route;
