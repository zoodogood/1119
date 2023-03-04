import { BaseRoute } from "#server/router.js";
import { ArticlesManager } from "./.mod.js";

const PREFIX = "/site/articles";


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, response){
		const articles = await ArticlesManager.fetchArticles();
		

		response.json(articles);
	}

}

export default Route;