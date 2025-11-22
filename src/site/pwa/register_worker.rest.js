import Path from 'node:path'

import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'

const PREFIX = '/pwa_worker_up'

class Route extends BaseRoute {
	prefix = PREFIX

	async get( request , response ) {
		const targetPath = Path.join( Path.join( process.cwd() , 'src/public' ) , 'pwa_service_worker.js' )
		response.sendFile( targetPath )
	}
}

export default Route
