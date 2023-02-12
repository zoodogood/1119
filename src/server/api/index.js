const PREFIX = "/";


class Route {
	constructor(express){
		express.get(PREFIX, this.get);
	}

	async get(request, responce){
		responce.redirect("/pages/")
	}
}

export default Route;