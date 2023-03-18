import { BaseRoute } from "#server/router.js";
import { TokensUsersExchanger } from "#server/api/oauth2/user.js";
import { ArticlesManager } from './.mod.js';

const PREFIX = "/site/articles/create";


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
		

		const rawUser = await TokensUsersExchanger.getUserRaw(token);
		if (rawUser === null){
			response.status(401).send(`"Authorization failed"`);
			return;
		}

		response.json( rawUser );
	}
}

export default Route;