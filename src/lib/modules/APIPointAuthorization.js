import client from "#bot/client.js";
import config from "#config";
import { OAuth2 } from "discord-oauth2-utils";
import { User } from "discord.js";

class TokensUsersExchanger {
  static #cacheMap = new Map();

  static fromCache(token) {
    const id = this.#cacheMap.get(token);
    if (!id) {
      return null;
    }

    return client.users.cache.get(id) ?? null;
  }

  static addToCache(token, userId) {
    this.#cacheMap.set(token, userId);
    return;
  }

  static async fromOAuth(token) {
    const data =
      (await APIPointAuthorizationManager.OAuth.fetchUser(token)) ?? {};
    const { user, guilds: _guilds } = data;

    if (!user?.id) {
      return null;
    }

    user.guilds = _guilds.guilds instanceof Array ? _guilds.guilds : null;

    return user;
  }

  static async getUserRaw(token, { requireOAuth, prepareGuilds = false } = {}) {
    const user = structuredClone(
      (!requireOAuth && this.fromCache(token)) ||
        (await this.fromOAuth(token)) ||
        null,
    );

    if (!user?.id) {
      return null;
    }

    user.avatarURL = client.rest.cdn.avatar(user.id, user.avatar);
    prepareGuilds &&
      (() => {
        user.guilds ||= [];
        !(user instanceof User) && this.fillGuilds(user.guilds);
        user.mutualBotGuilds = this.fetchMutualGuilds(user);
      })();

    this.addToCache(token, user.id);
    return user;
  }

  static fillGuilds(guilds) {
    for (const guild of guilds)
      guild.iconURL = guild.icon
        ? client.rest.cdn.icon(guild.id, guild.icon)
        : null;

    return;
  }

  static fetchMutualGuilds(user) {
    return client.users.cache.get(user.id).guilds.map((guild) => guild.id);
  }
}

async function authorizationProtocol(
  request,
  response,
  { allowRaw = false } = {},
) {
  const token = request.headers.authorization;
  if (!token) {
    response.status(401).send(`"Not authorized"`);
    return { status: false };
  }

  const rawUser = await TokensUsersExchanger.getUserRaw(token);
  if (rawUser === null) {
    response.status(401).send(`"Authorization failed"`);
    return { status: false };
  }

  const user = client.users.cache.get(rawUser.id);
  if (!user) {
    !allowRaw && response.status(404).send(`"Only partial data received"`);
    return { status: null, raw: rawUser };
  }

  return { status: true, data: user };
}

class APIPointAuthorizationManager {
  static authorizationProtocol = authorizationProtocol;
  static TokensUsersExchanger = TokensUsersExchanger;
  static OAuth = null;

  static onClientReady() {
    this.OAuth = new OAuth2({
      clientId: client.user.id,
      clientSecret: process.env.DISCORD_OAUTH2_TOKEN,

      scopes: ["identify", "guilds"],
      redirectURI: `${config.server.origin}/oauth2/callback`,
    });
  }
}

client.once("ready", () => {
  APIPointAuthorizationManager.onClientReady();
});

export default APIPointAuthorizationManager;
export {
  APIPointAuthorizationManager,
  TokensUsersExchanger,
  authorizationProtocol,
};
