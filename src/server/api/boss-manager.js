const PREFIX = "/boss-manager";
import BossManager from '#lib/modules/BossManager.js';
import { BaseRoute } from '#server/router.js';


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, responce){
		responce.send(String(BossManager));
	}
}

export default Route;