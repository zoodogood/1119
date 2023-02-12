import ErrorsHandler from "#src/lib/modules/ErrorsHandler.js";

const PREFIX = "/";


class Route {
	constructor(express){
		setTimeout(() => {
			express.use(PREFIX, this.catch);
		}, 100);
		
	}

	async catch(error, request, res, next){
		ErrorsHandler.Audit.push(error, {path: request.originalUrl});
	}
}

export default Route;