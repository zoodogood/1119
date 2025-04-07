import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'
import { sleep } from '#src/safe-utils.js'

class Route extends BaseRoute {
	constructor( express ) {
		super()

		this.start()
		this.express = express
	}

	async catch( request , response ) {
		response.status( 404 )
		response.send( '404' )
	}

	async start() {
		await sleep( 1 )
		this.express.use( this.catch )
	}
}

export default Route
