const PREFIX = "/errors/files";
import ErrorsHandler from '#lib/modules/ErrorsHandler.js';
import { BaseRoute } from '#server/router.js';


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, response){
		const list = await ErrorsHandler.Audit.fetchLogs();
		response.json(list);
	}
}

export default Route;