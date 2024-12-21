import { ArticlesManager } from "#src/articles/manager.js";
import { BaseRoute } from "#src/http_requests/api_router/BaseRoute.js";

const PREFIX = "/site/articles";

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express) {
		super();
	}

	async get(request, response) {
		const list = await ArticlesManager.fetchArticles();
		const metadata = ArticlesManager.CacheData.getBulk();
		response.json({ list, metadata });
	}
}

export default Route;
