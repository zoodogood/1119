const PREFIX = "/errors/current";
import ErrorsHandler from '#src/modules/ErrorsHandler.js';


class Route {
	constructor(express){
		express.get(PREFIX, this.get);
	}

	async get(request, responce){
		const json = ErrorsHandler.Audit.toJSON();
		responce.json(json);
	}
}

export default Route;