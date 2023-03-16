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
		const {user, guilds} = data;
		
		if (!user){
			return null;
		}

		user.guilds = guilds;
		return user;
	}

	static async getUserRaw(token, {requireOAuth}){
		const user = structuredClone(
			(!requireOAuth && this.fromCache(token)) || (await this.fromOAuth(token)) || null
		);

		if (!user?.id){
			return null;
		}
		
		user.avatarURL = client.rest.cdn.avatar(user.id, user.avatar);
		return user;
	}
}


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	#cacheMap = new Map();

	async get(request, response){
		const token = request.headers.authorization;
		if (!token){
			response.status(401).send(`"Not authorized"`);
			return;
		}

		const user = await TokensUsersExchanger.getUserRaw(token, {requireOAuth: true});
		if (user === null){
			response.status(401).send(`"Authorization failed"`);
			return;
		}

		response.json(user);
	}
}

export default Route;
export { TokensUsersExchanger };
