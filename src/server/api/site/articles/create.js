import { BaseRoute } from "#server/router.js";

const PREFIX = "/site/articles/create";


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async post(request, responce){
		if (!request.headers.authorization){
			responce.status(401).send("'Not authorized'");
		}
	}
}

export default Route;