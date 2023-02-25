import { BaseRoute } from "#server/router.js";

const PREFIX = "/site/articles/create";


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async post(request, response){
		if (!request.headers.authorization){
			response.status(401).send(`"Not authorized"`);
		}
	}
}

export default Route;