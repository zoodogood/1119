import client from "#bot/client.js";
import { BaseRoute } from "#server/router.js";
const PREFIX = "/user/settings-data";
import { authorizationProtocol } from "#lib/modules/APIPointAuthorization.js";

class UserSettings {
	static FIELDS = [
		{
			key: "chatChannelId",
			validate: () => {

			}
		}
	]
}

class GuildSettings {
	static FIELDS = {

	}
}

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}
	isSimple = false;

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

		const guildsId = request.headers.guilds ? JSON.parse(request.headers.guilds) : null;
		// to-do: end
		guildsId.map(id => 
			client.guilds.cache.get(id)
		)
		.filter(Boolean)
		.forEach(guild => 1);

		response.json(guildsId);
	}
}

export default Route;