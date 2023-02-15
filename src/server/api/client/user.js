import { BaseRoute } from "#server/router.js";
import client from "#bot/client.js";

const PREFIX = "/client/user";



class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, responce){
		const data = { ...client.user, displayAvatarURL: client.user.displayAvatarURL() };
		responce.json(data);
	}
}

export default Route;