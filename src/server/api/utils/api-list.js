import app from "#app";
import { BaseRoute } from "#server/router.js";


const PREFIX = "/utils/api-list";


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, responce){
		const router = app.server.router;
		const data = router.getParsedRoutesList();
		responce.json(data);
	}
}

export default Route;