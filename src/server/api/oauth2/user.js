const PREFIX = "/oauth2/user";
import client from '#bot/client.js';
import { BaseRoute } from '#server/router.js';
import oauth from './.mod.js';

class TokensUsersExchanger {
	static #cacheMap = new Map();

	static fromCache(token){
		const id = this.#cacheMap.get(token);
		if (!id){
			return null;
		}

		return client.users.cache.get(id) ?? null;
	}

	static addToCache(token, userId){
		this.#cacheMap.set(token, userId);
		return;
	}

	static async fromOAuth(token){
		const data = await oauth.fetchUser(token) ?? {};
		const {user, guilds: _guilds} = data;
		
		if (!user){
			return null;
		}

		user.guilds = _guilds.guilds;
		return user;
	}

	static async getUserRaw(token, {requireOAuth, prepareGuilds = false} = {}){

		const user = structuredClone(
			(!requireOAuth && this.fromCache(token)) || (await this.fromOAuth(token)) || null
		);

		if (!user?.id){
			return null;
		}
		
		user.avatarURL = client.rest.cdn.avatar(user.id, user.avatar);
		prepareGuilds && (() => {
			user.guilds ||= [];
			user.guilds && this.fillGuilds(user.guilds);
			user.mutualBotGuilds = this.fetchMutualGuilds(user);
		})();
		return user;
	}

	static fillGuilds(guilds){
		for (const guild of guilds)
		guild.iconURL = guild.icon ? client.rest.cdn.icon(guild.id, guild.icon) : null;
		
		return;
	}

	static fetchMutualGuilds(user){
		return client.users.cache.get(user.id).guilds.map(guild => guild.id);
	}
}


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, response){
		const token = request.headers.authorization;
		if (!token){
			response.status(401).send(`"Not authorized"`);
			return;
		}

		const prepareGuilds = !!request.headers.guilds;

		const user = await TokensUsersExchanger.getUserRaw(token, {requireOAuth: true, prepareGuilds});
		if (user === null){
			response.status(401).send(`"Authorization failed"`);
			return;
		}

		response.json(user);
	}
}

export default Route;
export { TokensUsersExchanger };
