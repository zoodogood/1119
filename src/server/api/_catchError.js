import ErrorsHandler from "#src/lib/modules/ErrorsHandler.js";
import { sleep } from "#lib/util.js";
import { BaseRoute } from "#server/router.js";

const PREFIX = "/";


class Route extends BaseRoute {
	constructor(express){
		super();

		this.start();
		this.express = express;
	}

	async catch(error, request, response, next){
		ErrorsHandler.Audit.push(error, {path: request.originalUrl});
		response.status(500);
		response.send("Error)!");
	}

	async start(){
		await sleep(1);
		this.express.use(PREFIX, this.catch);
	}
}

export default Route;