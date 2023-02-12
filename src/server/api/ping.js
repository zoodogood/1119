import { BaseRoute } from "#server/router.js";

const PREFIX = "/ping";


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, responce, next){
		try {
			throw new Error("1");	
		} catch (error) {
			next(error);
			return;
		}
		
		responce.send("Alive!")
	}
}

export default Route;