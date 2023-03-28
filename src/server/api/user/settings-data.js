import client from "#bot/client.js";
import { BaseRoute } from "#server/router.js";
const PREFIX = "/user/chest-open";
import { authorizationProtocol } from "#lib/managers/APIPointAuthorizationManager.js";


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async post(request, response){
		const {data: user} = await authorizationProtocol(request, response);
		if (!user){
			return;
		}

		const guildsId = request.headers.guilds ? JSON.parse(request.headers.guilds) : null;
	}

	async get(request, response){
		const {data: user} = await authorizationProtocol(request, response);
		if (!user){
			return;
		}
	}
}

export default Route;