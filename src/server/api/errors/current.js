const PREFIX = "/errors/current";
import ErrorsHandler from '#lib/modules/ErrorsHandler.js';
import { BaseRoute } from '#src/server/router.js';


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, responce){
		const json = ErrorsHandler.Audit.toJSON();
		responce.json(json);
	}
}

export default Route;