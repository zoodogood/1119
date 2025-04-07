import { APIPointAuthorizationManager } from '#src/auth/APIPointAuthorization/APIPointAuthorization.js'
import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'

const PREFIX = '/oauth2/auth'

class Route extends BaseRoute {
	prefix = PREFIX

	constructor() {
		super()
	}

	async get( request , response ) {
		const siteRedirect = request.query.redirect
		const redirectUri = APIPointAuthorizationManager.oAuth.authorizationLink( {
			state: siteRedirect ,
		} )

		response.redirect( redirectUri )
	}
}

export default Route
