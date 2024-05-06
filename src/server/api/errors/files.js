const PREFIX = "/errors/files";
import ErrorsHandler from "#lib/modules/ErrorsHandler.js";
import { BaseRoute } from "#server/router.js";

class Route extends BaseRoute {
  prefix = PREFIX;

  constructor(express) {
    super();
  }

  async get(request, response) {
    const list = [...ErrorsHandler.Core.filesList];
    const cacheManager = ErrorsHandler.Core.cache;
    const metadata = [];

    for (const key of list) {
      metadata.push(await cacheManager.fetch(key));
    }

    list.push(null);
    metadata.push(ErrorsHandler.actualSessionMetadata());

    response.json({ list, metadata });
  }
}

export default Route;
