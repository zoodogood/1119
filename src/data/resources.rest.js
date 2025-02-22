import { DataManager } from "#src/data/singleton.js";
import { BaseRoute } from "#src/http_requests/api_router/BaseRoute.js";

const PREFIX = "/client/audit/resources";

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express) {
		super();
	}

	async get(request, response) {
		response.json(DataManager.data.audit.resourcesChanges);
		return;
	}
}

export default Route;
