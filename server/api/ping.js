const PREFIX = "/ping";


class Route {
	constructor(express){
		express.get(PREFIX, this.get);
	}

	async get(request, responce){
		responce.send("Alive!")
	}
}

export default Route;