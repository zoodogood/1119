const PREFIX = "/oauth2/callback";
import oauth from './.mod.js';
import PagesRouter from '#site/lib/Router.js';
import { BaseRoute } from '#server/router.js';
import config from '#config';
import Path from 'path';


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}
	
	async get(request, responce){
		const code = request.query.code;
		
		if (!oauth.clientSecret){
			throw new Error("Accessing OAuth2 without DISCORD_OAUTH2_TOKEN");
		}

		if (!code) {
			responce.sendStatus(400);
			return;
		}

		
		
		const exchangeResponse = await oauth.getOAuth2Data(code);
		
		const redirect = request.query.state;
		
		const {server: {origin, paths}} = config;
		const base = origin.concat(
			`/${ Path.normalize(`${ paths.site }/${ PagesRouter.pages.oauth_index }`) }`
		);
			
		const queries = new URLSearchParams({
			code: exchangeResponse.access_token,
			redirect
		}).toString();

		const url = `${ base }?${ queries }`.replaceAll("\\", "/");
		responce.redirect(url);
	}
}

export default Route;