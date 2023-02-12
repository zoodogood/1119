const PREFIX = "/errors/files";
import ErrorsHandler from '#lib/modules/ErrorsHandler.js';


class Route {
	constructor(express){
		express.get(PREFIX, this.get);
	}

	async get(request, responce){
		const list = await ErrorsHandler.Audit.fetchLogs();
		responce.json(list);
	}
}

export default Route;