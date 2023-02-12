const PREFIX = "/errors/files/:name";
import ErrorsHandler from '#lib/modules/ErrorsHandler.js';
import { BaseRoute } from '#server/router.js';


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, responce){
		const fileName = request.params.name;
		const json = await ErrorsHandler.Audit.readFile(fileName);
		if (!json){
			responce.sendStatus(404);
			return;
		}
		
		const list = JSON.parse(json);
		responce.json(list);
	}
}

export default Route;