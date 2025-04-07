import client from '#src/bot/client/singleton.js'
import { generateInviteFor } from '#src/discord/utils.js'
import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'

const PREFIX = '/client/user'

class Route extends BaseRoute {
	prefix = PREFIX

	constructor( express ) {
		super()
	}

	async get( request , response ) {
		const invite = generateInviteFor( client )
		const displayAvatarURL = client.user.displayAvatarURL()
		const data = { ... client.user , displayAvatarURL , invite }
		response.json( data )
	}
}

export default Route
