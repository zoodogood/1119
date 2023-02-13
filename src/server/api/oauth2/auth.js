const PREFIX = "/oauth2/auth";
import { BaseRoute } from '#server/router.js';
import oauth from './.mod.js';

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, responce){
		responce.redirect(oauth.authorizationUrl);
		return;
	}
}

export default Route;