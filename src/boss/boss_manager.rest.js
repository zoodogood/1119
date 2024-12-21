const PREFIX = "/boss-manager";
import BossManager from "#src/boss/BossManager.js";
import { BaseRoute } from "#src/http_requests/api_router/BaseRoute.js";

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor() {
		super();
	}

	async get(request, response) {
		response.send(String(BossManager));
	}
}

export default Route;
