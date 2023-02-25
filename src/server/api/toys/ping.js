import { BaseRoute } from "#server/router.js";

const PREFIX = "/toys/ping";


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, response, next){
		response.send("Alive!")
	}
}

export default Route;