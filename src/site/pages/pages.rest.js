import Path from 'node:path'
import { DataManager } from '#src/data/singleton.js'
import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'
import { parsePagesPath } from '#src/safe-utils.js'

const ROOT = 'src/public'
const root = Path.join( process.cwd() , ROOT )
const target = 'index.html'

class Route extends BaseRoute {
	prefix = /^\/(?:(?:ru|ua|en)\/)?pages/

	statistic = {
		increment( request ) {
			const subpath = parsePagesPath( request.path ).subpath.join( '/' )
			const siteData = DataManager.data.site

			siteData.enterToPages[ subpath ] ||= 0
			siteData.enterToPages[ subpath ]++
			siteData.entersToPages++
			siteData.entersToPagesToday++
		} ,
	}

	constructor() {
		super()
	}

	async get( request , response ) {
		const targetPath = Path.join( root , target )
		response.sendFile( targetPath )

		this.statistic.increment( request )
	}
}

export default Route
