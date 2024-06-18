import { parse_body } from "#lib/express_utils.js";
import { authorizationProtocol } from "#lib/modules/APIPointAuthorization.js";
import { ChangelogDaemon } from "#lib/modules/mod.js";
import { BaseRoute } from "#server/router.js";

const PREFIX = "/modules/changelog_daemon/request_edit_change";

class Route extends BaseRoute {
  prefix = PREFIX;

  constructor() {
    super();
  }

  async post(request, response) {
    const { data: user } = await authorizationProtocol(request, response);

    console.log({ user });
    if (!user) {
      return;
    }

    const body = await parse_body(request);
    const { target, previous, value } = body;
    const item = ChangelogDaemon.data.find(
      ({ createdAt }) => createdAt === target,
    );

    item.change = item.change.replace(previous, value);
    response.status(200).send("ok");
  }
}

export default Route;
