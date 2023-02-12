const PREFIX = "/boss-manager";
import BossManager from '#lib/modules/BossManager.js';


class Route {
	constructor(express){
		express.get(PREFIX, this.get);
	}

	async get(request, responce){
		responce.send(String(BossManager));
	}
}

export default Route;