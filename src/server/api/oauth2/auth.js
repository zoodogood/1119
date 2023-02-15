const PREFIX = "/oauth2/auth";
import { BaseRoute } from '#server/router.js';
import oauth from './.mod.js';

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, responce){
		const siteRedirect = request.query.redirect;
		const redirectURL = oauth.getLink();

		// https://stackoverflow.com/questions/58858066/pass-a-string-through-discord-oauth
		const injectSiteRedirect = (original, redirectURL) =>
			original.concat(`&state=${ redirectURL }`);

		responce.redirect(
			siteRedirect ?
				injectSiteRedirect(redirectURL, siteRedirect) :
				redirectURL
		);
		return;
	}
}

export default Route;