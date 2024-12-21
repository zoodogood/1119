import { BaseRoute } from "#src/http_requests/api_router/BaseRoute.js";

const PREFIX = "/utils/icons_list";

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor() {
		super();
	}

	async get(request, response) {
		response.redirect("/src/public/resources/fonts/fontello/demo");
	}
}

export default Route;
