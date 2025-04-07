import client from '#src/bot/client/singleton.js'
import CommandsManager from '#src/commands/CommandsManager/singleton.js'
import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'

const PREFIX = '/client/statistic/general'

class Route extends BaseRoute {
	prefix = PREFIX

	constructor( express ) {
		super()
	}

	async get( request , response ) {
		const data = {
			guilds: client.guilds.cache.size ,
			users: client.users.cache.size ,
			channels: client.channels.cache.size ,
			commands: CommandsManager.collection.size ,
		}
		response.json( data )
	}
}

export default Route
