import { ArticlesManager } from '#src/articles/manager.js'
import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'

const PREFIX = '/site/articles/item/**'

class Route extends BaseRoute {
	prefix = PREFIX

	constructor( express ) {
		super()
	}

	async delete( request , response ) {}

	async get( request , response ) {
		const id = request.params[ 0 ]
		const content = await ArticlesManager.getArticleContent( id )
		if ( content === null ) {
			response.status( 404 ).send()
			return
		}

		response.json( content )
	}

	async post( request , response ) {}
}

export default Route
