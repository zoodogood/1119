import ErrorsHandler from '#src/ErrorsHandler/ErrorsHandler.js'
import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'
import { sleep } from '#src/safe-utils.js'

const PREFIX = '/'

class Route extends BaseRoute {
	constructor( express ) {
		super()

		this.start()
		this.express = express
	}

	async catch( error , request , response , next ) {
		ErrorsHandler.onErrorReceive( error , {
			path: request.originalUrl ,
			source: 'API' ,
		} )
		response.status( 500 )
		response.json(
			`Ошибка сервера переданная от сервера: "${ error.message }". Информация об ошибке записана и может быть найдена по адресу /pages/errors/select` ,
		)
	}

	async start() {
		await sleep( 1 )
		this.express.use( PREFIX , this.catch )
	}
}

export default Route
