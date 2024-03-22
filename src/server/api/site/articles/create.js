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
    const { data: user } = await authorizationProtocol(request, response);
    if (!user) {
      return;
    }

    await new Promise((resolve) =>
      bodyParser.raw()(request, response, resolve),
    );

    const author = omit(user, (key) =>
      ["id", "username", "discriminator"].includes(key),
    );
    author.avatarURL = user.avatarURL();

    const filename = request.headers.filename;

    if (filename.includes("..")) {
      response.status(400).send();
      return;
    }
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
