import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'
import { relativeToProjectRoot } from '#src/projectRootPath.js'
import { SITE_PUBLIC_DIR_PATH } from '#src/site/constants.js'

const PREFIX = /\/public+?/


export default class Route extends BaseRoute {
	prefix = PREFIX

	async get( request , response ) {
		response.sendFile(
			relativeToProjectRoot( SITE_PUBLIC_DIR_PATH , request.path.replace( /^\/public\// , './' ) ) ,
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
