import { collectDailyData } from '#src/daily_audit/index.js'
import { DataManager } from '#src/data/singleton.js'
import { BaseRoute } from '#src/http_requests/api_router/BaseRoute.js'
import { timestampDay } from '#src/safe-utils.js'

const PREFIX = '/client/audit/daily'

class Route extends BaseRoute {
	prefix = PREFIX

	constructor() {
		super()
	}

	async get( request , response ) {
		const currentDay = timestampDay( Date.now() )
		const currentData = collectDailyData()

		response.json( {
			... DataManager.data.audit.daily ,
			[ currentDay ]: currentData ,
		} )
	}
}

export default Route
