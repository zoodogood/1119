const PREFIX = "/oauth2/auth";
import oauth from './.mod.js';

class Route {

	constructor(express){
		express.get(PREFIX, this.get);
		return;
	}

	async get(request, responce){
		responce.redirect(oauth.authorizationUrl);
		return;
	}
}

export default Route;