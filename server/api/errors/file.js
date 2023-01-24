const PREFIX = "/errors/files/:name";
import ErrorsHandler from '#src/modules/ErrorsHandler.js';


class Route {
	constructor(express){
		express.get(PREFIX, this.get);
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