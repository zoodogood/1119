import { BaseRoute } from "#server/router.js";

const PREFIX = "/user/chest-open";


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async post(request, response){
		
	}
}

export default Route;