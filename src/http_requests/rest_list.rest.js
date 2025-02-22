import { BaseRoute } from "#src/http_requests/api_router/BaseRoute.js";
import { api_router } from "./api_router/singleton.js";

const PREFIX = "/utils/api_list";

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor() {
		super();
	}

	async get(request, response) {
		response.json(api_router.getParsedRoutesList());
	}
}

export default Route;
