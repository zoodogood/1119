const PREFIX = "/errors/files/:name";
import ErrorsHandler from "#src/ErrorsHandler/ErrorsHandler.js";
import { BaseRoute } from "#src/http_requests/api_router/BaseRoute.js";

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express) {
		super();
	}

	async get(request, response) {
		const fileName = request.params.name;
		const json = await ErrorsHandler.File.readFile(fileName);
		if (!json) {
			response.sendStatus(404);
			return;
		}
		response.json(json);
	}
}

export default Route;
