import { BaseRoute } from "#server/router.js";
import { TokensUsersExchanger } from "#server/api/oauth2/user.js";
import { ArticlesManager } from './.mod.js';
import { omit } from "#lib/safe-utils.js";
import bodyParser from "body-parser";


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
		
		await new Promise(resolve => 
			bodyParser.raw()(request, response, resolve)
		);

		const rawUser = await TokensUsersExchanger.getUserRaw(token);
		if (rawUser === null){
			response.status(401).send(`"Authorization failed"`);
			return;
		}

		const author = omit(
			rawUser,
			(key) => ["id", "avatarURL", "username", "discriminator"].includes(key)
		);

		const filename = request.headers.filename;
		const content = String(request.body);

		const data = await ArticlesManager.createArticle({content, author, id: `${ rawUser.id }/${ filename }`});
		response.json( data );
	}
}

export default Route;