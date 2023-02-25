import { BaseRoute } from "#server/router.js";

const PREFIX = "/toys/throw";


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, response, next){
		throw new Error("1");
	}
}

export default Route;