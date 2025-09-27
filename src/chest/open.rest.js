import { authorizationProtocol } from '#src/auth/APIPointAuthorization/APIPointAuthorization.js'
import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'
import { userDataOf } from '../data/singleton.js'
import { ChestManager } from './command.chest.js'

const PREFIX = '/user/chest_open'

class Route extends BaseRoute {
	prefix = PREFIX

	constructor() {
		super()
	}

	async post( request , response ) {
		const { user } = await authorizationProtocol( request , response )
		if ( !user ) {
			return
		}

		const cooldown = ChestManager.cooldown.for( userDataOf( user ) )

		if ( cooldown.isOverloaded() ) {
			response
				.status( 405 )
				.json( { notAllowed: 'cooldown' , value: cooldown.overload() } )
			return
		}

		const resources = ChestManager.open( {
			user ,
			context: { request , response } ,
		} )
		cooldown.install()
		response.json( resources )
	}
}

export default Route
