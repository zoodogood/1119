import { DataManager } from '#src/data/singleton.js'
import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'
import { parsePagesPath } from '#src/safe-utils.js'
import { relativeToProjectRoot } from '#src/projectRootPath.js'
import { SITE_DIR_PATH } from '#src/site/constants.js'

class Route extends BaseRoute {
	prefix = /^\/pages/

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
		const targetPath = relativeToProjectRoot(SITE_DIR_PATH, "index.html")
		response.sendFile( targetPath )

		this.statistic.increment( request )
	}
}

export default Route
