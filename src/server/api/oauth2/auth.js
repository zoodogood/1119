const PREFIX = "/oauth2/auth";
import { BaseRoute } from '#server/router.js';
import { APIPointAuthorizationManager } from '#lib/modules/APIPointAuthorization.js';

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, response){
		const siteRedirect = request.query.redirect;
		const redirectURL = APIPointAuthorizationManager.OAuth.getLink({state: siteRedirect});

		response.redirect(
			redirectURL
		);
		return;
	}
}

export default Route;