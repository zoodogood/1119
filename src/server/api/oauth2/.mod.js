import client from "#bot/client.js";
import config from "#config";
import OAuth from "@arthur.dev/discord-oauth2";



const oauth2 = 
	new OAuth.default({
		clientId: client.user.id,
		clientSecret: process.env.DISCORD_OAUTH2_TOKEN,

		scope: ["identify", "guilds"],
		callbackUrl: `${ config.server.origin }/oauth2/callback`,
	});

export default oauth2;

