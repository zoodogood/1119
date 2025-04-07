import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'

const PREFIX = '/toys/ping'

class Route extends BaseRoute {
	prefix = PREFIX

	constructor( express ) {
		super()
	}

	async get( request , response , next ) {
		response.send( 'Alive!' )
	}
}

export default Route
