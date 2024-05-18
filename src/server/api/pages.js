import DataManager from "#lib/modules/DataManager.js";
import { BaseRoute } from "#server/router.js";
import config from "#config";
import Path from "path";
import { parsePagesPath } from "#lib/safe-utils.js";

const ROOT = "static";
const root = Path.join(process.cwd(), ROOT);
const target = "index.html";

const PREFIX = /^\/(?:(?:ru|ua|en)\/)?pages/;

class Route extends BaseRoute {
  prefix = PREFIX;

  constructor(express) {
    super();
  }

  async get(request, response) {
    const targetPath = Path.join(root, target);
    response.sendFile(targetPath);

    this.statistic.increment(request);
  }

  statistic = {
    increment(request) {
      const subpath = parsePagesPath(request.path).subpath.join("/");
      const siteData = DataManager.data.site;

      siteData.enterToPages[subpath] ||= 0;
      siteData.enterToPages[subpath]++;
      siteData.entersToPages++;
      siteData.entersToPagesToday++;
    },
  };
}

export default Route;
