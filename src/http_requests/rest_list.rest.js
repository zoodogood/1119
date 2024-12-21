import { BaseRoute } from "#src/http_requests/api_router/BaseRoute.js";

const PREFIX = "/utils/api_list";

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor() {
		super();
	}

	async get(request, response) {
		const { server_singleton } = await import(
			"#src/http_requests/server_singleton.js"
		);
		const router = server_singleton.router;
		const data = router.getParsedRoutesList();
		response.json(data);
	}
}

export default Route;
