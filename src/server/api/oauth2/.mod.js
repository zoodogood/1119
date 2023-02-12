import client from "#bot/client.js";
import OAuth from "@arthur.dev/discord-oauth2";

/** @type {OAuth} */
const oauth2 = new OAuth.default({
	clientId: client.id,
	clientSecret: process.env.DISCORD_OAUTH2_TOKEN,

	scope: ["identify", "guilds"],
	callbackUrl: "http://localhost:8001/oauth2/callback",
});


export default oauth2;

