import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'

const PREFIX = '/.well-known/pki-validation/<secret>.txt'

class Route extends BaseRoute {
	isHidden = true
	prefix = PREFIX

	constructor( express ) {
		super()
	}

	async get( request , response ) {
		response.json( `<Спрятано>` )
	}
}

export default Route
