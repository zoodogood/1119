const PREFIX = "/oauth2/callback";
import oauth from './.mod.js';
import Router from '#site/lib/Router.js';

class Route {

	constructor(express){
		express.get(PREFIX, this.get);
		return;
	}

	async get(request, responce){
		const code  = request.query.code;
		if (!code) {
			responce.sendStatus(400);
			return;
		}
		
		const exchangeResponse = await oauth.exchangeCode(code);
		Router.relativeToPage(Router.pages.oauth_Active, {hash: {code: exchangeResponse.access_token}});
		responce.redirect(`/pages/oauth/active#code=${ exchangeResponse.access_token }`);
	}
}

export default Route;