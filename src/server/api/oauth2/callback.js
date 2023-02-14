const PREFIX = "/oauth2/callback";
import oauth from './.mod.js';
import Router from '#site/lib/Router.js';
import { BaseRoute } from '#server/router.js';

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}
	
	async get(request, responce){
		const code  = request.query.code;

		if (!oauth.clientSecret){
			throw new Error("Accessing OAuth2 without DISCORD_OAUTH2_TOKEN");
		}

		if (!code) {
			responce.sendStatus(400);
			return;
		}
		
		const exchangeResponse = await oauth.exchangeCode(code);
		
		const redirect = request.query.state;
		const url = `${ Router.pages.oauth_active }?code=${ exchangeResponse.access_token }${ redirect }`;
		responce.redirect(url);
	}
}

export default Route;