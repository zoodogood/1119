import { BaseRoute } from "#server/router.js";
import { ArticlesManager } from "./.mod.js";
import { omit } from "#lib/safe-utils.js";
import bodyParser from "body-parser";
import { authorizationProtocol } from "#lib/modules/APIPointAuthorization.js";

const PREFIX = "/site/articles/create";

class Route extends BaseRoute {
  prefix = PREFIX;

  constructor(express) {
    super();
  }

  async post(request, response) {
    const { data: user } = authorizationProtocol(request, response);

    await new Promise((resolve) =>
      bodyParser.raw()(request, response, resolve),
    );

    const author = omit(user, (key) =>
      ["id", "avatarURL", "username", "discriminator"].includes(key),
    );

    const filename = request.headers.filename;
    const content = String(request.body);

    const data = await ArticlesManager.createArticle({
      content,
      author,
      id: `${user.id}/${filename}`,
    });
    response.json(data);
  }
}

export default Route;
