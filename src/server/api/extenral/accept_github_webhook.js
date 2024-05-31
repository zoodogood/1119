import client from "#bot/client.js";
import config from "#config";
import { parse_body } from "#lib/express_utils.js";
import { toLocaleDeveloperTypes } from "#lib/safe-utils.js";
import { BaseRoute } from "#server/router.js";

const PREFIX = "/accept_github_commit_webhook";

class Route extends BaseRoute {
  isHidden = true;
  prefix = PREFIX;

  constructor() {
    super();
  }

  async post(request, response) {
    const eventName = request.headers["x-github-event"];

    await parse_body(request, response, { method: "json" });
    response.sendStatus(202);
    const description = Object.entries(request.body)
      .map(([key, value]) => `- ${key} => ${toLocaleDeveloperTypes(value)}`)
      .join("\n")
      .slice(0, 4000);
    client.channels.cache.get(config.guild.logChannelId).msg({
      title: `Github \`${eventName}\` webhook handler`,
      description,
    });
  }
}

export default Route;
