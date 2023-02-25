const PREFIX = "/oauth2/auth";
import { BaseRoute } from '#server/router.js';
import oauth from './.mod.js';

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, response){
		const siteRedirect = request.query.redirect;
		const redirectURL = oauth.getLink({state: siteRedirect});

		response.redirect(
			redirectURL
		);
		return;
	}
}

export default Route;