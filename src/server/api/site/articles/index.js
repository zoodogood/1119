import { BaseRoute } from "#server/router.js";
import { ArticlesManager } from "./.mod.js";

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
