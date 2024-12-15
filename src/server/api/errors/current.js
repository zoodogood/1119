const PREFIX = "/errors/current";
import ErrorsHandler from "#lib/ErrorsHandler/ErrorsHandler.js";
import { BaseRoute } from "#src/server/router.js";

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express) {
		super();
	}

	async get(request, response) {
		const json = ErrorsHandler.Core.toJSON();
		response.json(json);
	}
}

export default Route;
