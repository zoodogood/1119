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

    if (!user) {
      return;
    }

    const body = await parse_body(request);
    const { target, previous, value } = JSON.parse(body);

    const item = ChangelogDaemon.data.find(
      ({ createdAt }) => createdAt === target,
    );

    if (!item) {
      response
        .status(404)
        .send(
          `change not found to be edited createdAt = ${target}, previous = "${previous}"`,
        );
      return;
    }

    item.change = value;
    response.status(200).send("ok");
  }
}

export default Route;
