import { ArticlesManager } from '#src/articles/manager.js'
import { authorizationProtocol } from '#src/auth/APIPointAuthorization/APIPointAuthorization.js'
import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'
import { parse_body } from '#src/http_requests/express_utils.js'
import { omit } from '@zoodogood/utils/objectives'

const PREFIX = '/site/articles/create'

class Route extends BaseRoute {
	prefix = PREFIX

	constructor() {
		super()
	}

	async post( request , response ) {
		const { user } = await authorizationProtocol( request , response )
		if ( !user ) {
			return
		}

		await parse_body( request , null , { method: 'raw' } )

		const author = omit( user , key =>
			[ 'id' , 'username' , 'discriminator' ].includes( key ) )
		author.avatarURL = user.avatarURL()

		const { filename } = request.headers

		if ( filename.includes( '..' ) ) {
			response.status( 400 ).send()
			return
		}
		const content = String( request.body )

		const data = await ArticlesManager.createArticle( {
			content ,
			author ,
			id: `${ user.id }/${ filename }` ,
		} )
		response.json( data )
	}
}

export default Route
