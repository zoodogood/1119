import CommandsManager from '#src/commands/CommandsManager/singleton.js'
import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'

const PREFIX = '/client/commands/list'

class Route extends BaseRoute {
	prefix = PREFIX

	constructor( express ) {
		super()
	}

	async get( request , response ) {
		const commands = CommandsManager.collection.map(
			command => command.options ,
		)
		response.json( commands )
	}
}

export default Route
