import client from "#bot/client.js";
import config from "#config";
import { parse_body } from "#lib/express_utils.js";
import { BaseRoute } from "#server/router.js";

const PREFIX = "/accept_github_commit_webhook";

class Route extends BaseRoute {
  isHidden = true;
  prefix = PREFIX;

  constructor(express) {
    super();
  }

  async post(request, response) {
    const eventName = request.headers["x-github-event"];
    console.log(request, eventName);
    response.sendStatus(202);
    const body = await parse_body(request);
    client.channels.cache.get(config.guild.logChannelId).msg({
      title: "Github push webhook handler",
      description: `${String(body).slice(0, 4000)}`,
    });
  }
}

export default Route;
