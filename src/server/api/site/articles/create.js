import { parse_body } from "#lib/express_utils.js";
import { authorizationProtocol } from "#lib/modules/APIPointAuthorization.js";
import { omit } from "#lib/safe-utils.js";
import { BaseRoute } from "#server/router.js";
import { ArticlesManager } from "./.mod.js";

const PREFIX = "/site/articles/create";

class Route extends BaseRoute {
  prefix = PREFIX;

  constructor() {
    super();
  }

  async post(request, response) {
    const { user } = await authorizationProtocol(request, response);
    if (!user) {
      return;
    }

    await parse_body(request, null, { method: "raw" });

    const author = omit(user, (key) =>
      ["id", "username", "discriminator"].includes(key),
    );
    author.avatarURL = user.avatarURL();

    const { filename } = request.headers;

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
