const PREFIX = "/oauth2/user";
import { BaseRoute } from '#server/router.js';
import oauth from './.mod.js';

class Route extends BaseRoute {
	prefix = PREFIX;
	isSimple = false;

	constructor(express){
		super();
	}

	async get(request, responce){
		const secret = request.headers.authorization;

		if (!secret){
			responce.status(401).send(`"Not authorized"`);
			return;
		}

		const user = await oauth.fetchUser(secret);
		if (!user){
			responce.status(401).send(`"Authorization failed"`);
			return;
		}
		
		responce.json(user);
		return;
	}
}

export default Route;