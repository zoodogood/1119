import ErrorsHandler from '#src/ErrorsHandler/ErrorsHandler.js'
import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'

const PREFIX = '/errors/current'

class Route extends BaseRoute {
	prefix = PREFIX

	constructor( express ) {
		super()
	}

	async get( request , response ) {
		const json = ErrorsHandler.Core.toJSON()
		response.json( json )
	}
}

export default Route
