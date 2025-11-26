import process from 'node:process'
import config from '#config'
import client , { whenClientIsReady } from '#src/bot/client/singleton.js'
import { MINUTE, SECOND } from '#src/constants/time.js'
import { guildsOfUser } from '#src/discord/utils.js'
import { useOnce } from '#src/fp/useOnce.js'
import { withMaxWait } from '#src/fp/withMaxWait.js'
import { OAuth } from 'discord-oauth2-utils'
import { User } from 'discord.js'

export const whenOAuthInitialized = useOnce( async () => {
	await withMaxWait(whenClientIsReady(), MINUTE * 2, "in there session OAuth initialization is cancelled, because client is not ready")
	return new OAuth( {
		clientId: client.user.id ,
		clientSecret: process.env.DISCORD_OAUTH2_TOKEN ,
		scopes: [ 'identify' , 'guilds' ] ,
		redirectUri: `${ config.server.origin }/oauth2/callback` ,
	} )
} ,
)

class TokensUsersExchanger {
	static #cacheMap = ( new Map )

	static addToCache( token , userId ) {
		this.#cacheMap.set( token , userId )
	}

	static fetchMutualGuilds( user ) {
		return guildsOfUser( client.users.cache.get( user.id ) ).map( guild => guild.id )
	}

	static fillGuilds( guilds ) {
		for ( const guild of guilds ) {
			guild.iconURL = guild.icon
				? client.rest.cdn.icon( guild.id , guild.icon )
				: null
		}
	}

	static fromCache( token ) {
		const id = this.#cacheMap.get( token )
		if ( !id ) {
			return null
		}

		return client.users.cache.get( id ) ?? null
	}

	static async fromOAuth( token ) {
		const oAuth = await withMaxWait( whenOAuthInitialized() , 5 * SECOND , 'sometimes oauth server is not availableimes' )
		const user = ( await oAuth.fetchUser( token ) ) ?? {}
		const guilds = ( await oAuth.fetchGuilds( token ) ) ?? {}

		if ( !user.id ) {
			return null
		}
		user.guilds = guilds
		return user
	}

	static async getUserRaw( token , { requireOAuth , prepareGuilds = false } = {} ) {
		const user = structuredClone(
			( !requireOAuth && this.fromCache( token ) )
			|| ( await this.fromOAuth( token ) )
			|| null ,
		)

		if ( !user?.id ) {
			return null
		}

		user.avatarURL = client.rest.cdn.avatar( user.id , user.avatar )
		prepareGuilds
		&& ( () => {
			user.guilds ||= []
			!( user instanceof User ) && this.fillGuilds( user.guilds )
			user.mutualBotGuilds = this.fetchMutualGuilds( user )
		} )()

		this.addToCache( token , user.id )
		return user
	}
}

async function authorizationProtocol(
	request ,
	response ,
	{ allowRaw = false } = {} ,
) {
	const token = request.headers.authorization
	if ( !token ) {
		response.status( 401 ).send( `"Not authorized"` )
		return { status: false }
	}

	const rawUser = await TokensUsersExchanger.getUserRaw( token )
	if ( rawUser === null ) {
		response.status( 401 ).send( `"Authorization failed"` )
		return { status: false }
	}

	const user = client.users.cache.get( rawUser.id )
	if ( !user ) {
		!allowRaw && response.status( 404 ).send( `"Only partial data received"` )
		return { status: null , raw: rawUser }
	}

	return { status: true , user }
}

class APIPointAuthorizationManager {
	static authorizationProtocol = authorizationProtocol
	static TokensUsersExchanger = TokensUsersExchanger
}

export default APIPointAuthorizationManager
export {
	APIPointAuthorizationManager ,
	authorizationProtocol ,
	TokensUsersExchanger ,
}
