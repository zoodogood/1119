import client from '#bot/client.js';

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

async function authorizationProtocol(request, response){
	const token = request.headers.authorization;
	if (!token){
		response.status(401).send(`"Not authorized"`);
		return {status: false};
	}
	

	const rawUser = await TokensUsersExchanger.getUserRaw(token);
	if (rawUser === null){
		response.status(401).send(`"Authorization failed"`);
		return {status: false};
	}

	const user = client.users.cache.get(rawUser.id);
	return {status: true, data: user};
}




class APIPointAuthorizationManager {
	static authorizationProtocol = authorizationProtocol;
}

export { APIPointAuthorizationManager, TokensUsersExchanger, authorizationProtocol };