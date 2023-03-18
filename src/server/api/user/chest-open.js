import client from "#bot/client.js";
import { BaseRoute } from "#server/router.js";
import { TokensUsersExchanger } from "#server/api/oauth2/user.js";
import { ChestManager } from '#folder/commands/chest.js';
const PREFIX = "/user/chest-open";


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async post(request, response){
		const token = request.headers.authorization;
		if (!token){
			response.status(401).send(`"Not authorized"`);
			return;
		}
		

		const rawUser = await TokensUsersExchanger.getUserRaw(token, {requireOAuth: true});
		if (rawUser === null){
			response.status(401).send(`"Authorization failed"`);
			return;
		}

		const user = client.users.cache.get(rawUser.id);
		const cooldown = ChestManager.cooldown.for(user.data);

		if (cooldown.checkYet()){
			response.status(405).json({notAllowed: "cooldown", value: -cooldown.diff()});
			return;
		}

		const resources = ChestManager.open({userData: user.data});
		cooldown.install();
		response.json(resources);
	}
}

export default Route;