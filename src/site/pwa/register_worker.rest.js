import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'
import { relativeToProjectRoot } from '#src/projectRootPath.js'
import { SITE_DIR_PATH } from '#src/site/constants.js'

class Route extends BaseRoute {
	prefix = '/register_pwa_worker'

	async get( request , response ) {
		const targetPath = relativeToProjectRoot( SITE_DIR_PATH , 'pwa/service_worker.js' )
		response.sendFile( targetPath )
	}
}

export default Route
