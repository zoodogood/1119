import client from "#bot/client.js";
import config from "#config";
import {OAuth2} from "discord-oauth2-utils";



const oauth2 = 
	new OAuth2({
		clientId: client.user.id,
		clientSecret: process.env.DISCORD_OAUTH2_TOKEN,

		scopes: ["identify", "guilds"],
		redirectURI: `${ config.server.origin }/oauth2/callback`,
	});



export default oauth2;

