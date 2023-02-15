import { BaseRoute } from "#server/router.js";

const PREFIX = "/site/articles/item";


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, responce){
		responce.redirect("/pages/")
	}

	async post(request, responce){

	}

	async delete(request, responce){

	}
}

export default Route;