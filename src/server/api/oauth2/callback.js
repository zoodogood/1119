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

		let options = {
			url: 'https://discord.com/api/oauth2/token',
			method: 'POST',
			headers: {
			  'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
			  'client_id': oauth.clientId,
			  'client_secret': oauth.clientSecret,
			  'grant_type': 'authorization_code',
			  'code': code,
			  'redirect_uri': oauth.callbackUrl,
			  'scope': 'identify guilds'
			})
		 }
		 
		let discord_data = await fetch('https://discord.com/api/oauth2/token', options);
		const data = await discord_data.json();
		console.log(data);
		
		const exchangeResponse = await oauth.exchangeCode(code);
		
		const redirect = request.query.state;
		
		const {server: {origin, paths}} = config;
		const base = Path.resolve(origin, paths.site, PagesRouter.pages.oauth_active);

		const url = `${ base }?code=${ exchangeResponse.access_token }${ redirect }`;
		responce.redirect(url);
	}
}

export default Route;