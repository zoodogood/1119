import { authorizationProtocol } from '#src/auth/APIPointAuthorization/APIPointAuthorization.js'
import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'
import { userDataOf } from '../data/singleton.js'

const PREFIX = '/user/data'

class Route extends BaseRoute {
	isSimple = false

	prefix = PREFIX
	constructor() {
		super()
	}

	async get( request , response ) {
		const { user } = await authorizationProtocol( request , response )
		if ( !user ) {
			return
		}

		response.json( userDataOf(user))
	}
}

export default Route
