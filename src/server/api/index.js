import { BaseRoute } from "#server/router.js";

const PREFIX = "/";


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, response){
		response.redirect("/pages/")
	}
}

export default Route;