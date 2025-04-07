import ErrorsHandler from '#src/ErrorsHandler/ErrorsHandler.js'
import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'

const PREFIX = '/errors/files'

class Route extends BaseRoute {
	prefix = PREFIX

	constructor( express ) {
		super()
	}

	async get( request , response ) {
		const list = [ ... ErrorsHandler.Core.filesList ]
		const cacheManager = ErrorsHandler.Core.cache
		const metadata = []

		for ( const key of list ) {
			metadata.push( await cacheManager.fetch( key ) )
		}

		list.push( null )
		metadata.push( ErrorsHandler.actualSessionMetadata() )

		response.json( { list , metadata } )
	}
}

export default Route
