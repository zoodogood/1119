import { BaseRoute } from "#server/router.js";
import DataManager from "#lib/modules/DataManager.js";


const PREFIX = "/client/audit/daily";



class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, response){
		response.json( DataManager.data.dailyAudit );
		return
	}
}

export default Route;