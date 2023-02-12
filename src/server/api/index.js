import { BaseRoute } from "#server/router.js";

const PREFIX = "/";


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, responce){
		responce.redirect("/pages/")
	}
}

export default Route;