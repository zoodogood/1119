import { whenOAuthInitialized } from '#src/auth/APIPointAuthorization/APIPointAuthorization.js'
import { SECOND } from '#src/constants/time.js'
import { withMaxWait } from '#src/fp/withMaxWait.js'
import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'

const PREFIX = '/oauth2/auth'

class Route extends BaseRoute {
	prefix = PREFIX

	constructor() {
		super()
	}

	async get( request , response ) {
		const siteRedirect = request.query.redirect

		const redirectUri = ( await withMaxWait( whenOAuthInitialized() , 5 * SECOND , 'sometimes oauth server is not availableimes' ) )
			.authorizationLink( {
				state: siteRedirect ,
			} )

		response.redirect( redirectUri )
	}
}

export default Route
