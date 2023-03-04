import { ArticlesManager } from "./.mod.js";
import { BaseRoute } from "#server/router.js";


const PREFIX = "/site/articles/item/**";


class Route extends BaseRoute {
	prefix = PREFIX;
	directory = "static/articles";

	constructor(express){
		super();
	}

	async get(request, response){
		const id = request.params[0];
		const content = await ArticlesManager.getArticleContent(key);
		if (content === null){
			response.status(404).send();
		}

		response.json(content);
	}

	async post(request, response){

	}

	async delete(request, response){

	}
}

export default Route;