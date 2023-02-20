import { BaseRoute } from "#server/router.js";

const PREFIX = "/site/articles";


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, responce){
		
	}
}

export default Route;