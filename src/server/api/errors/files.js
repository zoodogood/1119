const PREFIX = "/errors/files";
import ErrorsHandler from '#lib/modules/ErrorsHandler.js';
import { BaseRoute } from '#server/router.js';


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, responce){
		const list = await ErrorsHandler.Audit.fetchLogs();
		responce.json(list);
	}
}

export default Route;