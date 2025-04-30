import path from 'node:path'
import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'

const PREFIX = /\/public+?/
const public_dir = path.resolve( process.cwd() , 'src/public' )

export default class Route extends BaseRoute {
	prefix = PREFIX

	async get( request , response ) {
		response.sendFile(
			path.resolve( public_dir , request.path.replace( /^\/public\// , './' ) ) ,
			( error ) => {
				if ( error instanceof Error === false ) {
					return
				}
				if ( error.code === 'ENOENT' ) {
					response.sendStatus( 404 )
					return
				}
				if ( error.code === 'EISDIR' ) {
					return response.sendStatus( 404 )
				}
				throw error
			} ,
		)
	}
}
