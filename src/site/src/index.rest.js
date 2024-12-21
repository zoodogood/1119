import { BaseRoute } from "#src/http_requests/api_router/BaseRoute.js";

const PREFIX = "/";

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor() {
		super();
	}

	async get(request, response) {
		response.redirect("/pages/");
	}
}

export default Route;
