import client from "#bot/client.js";
import { authorizationProtocol } from "#lib/modules/APIPointAuthorization.js";
import { BaseRoute } from "#server/router.js";
const PREFIX = "/user/settings-data";

class UserSettings {
  static FIELDS = [
    {
      key: "chatChannelId",
      validateClient: (previous, value, context) => {},
      validateServer: (previus, value, context) => {},
      onInput() {},
      onChange() {},
      createInput(context) {
        return { component: "selectChannel", props: { values: context.x } };
      },
    },
  ];
}

class GuildSettings {
  static FIELDS = [
    {
      key: "chatChannelId",
      description: "Укажите канал для отправки в него ежеденевной статистики",
      validateClient: (previous, value, context) => {},
      validateServer: (previus, value, context) => {},
      onInput() {},
      onChange() {},
      createInput(context) {
        return { component: "selectChannel", props: { values: context.x } };
      },
    },
  ];
}

class Route extends BaseRoute {
  isSimple = false;

  prefix = PREFIX;
  constructor() {
    super();
  }

  async get(request, response) {
    const { user } = await authorizationProtocol(request, response);
    if (!user) {
      return;
    }

    const guildsId = request.headers.guilds
      ? JSON.parse(request.headers.guilds)
      : null;
    // to-do: end
    guildsId
      .map((id) => client.guilds.cache.get(id))
      .filter(Boolean)
      .forEach((guild) => 1);

    response.json(guildsId);
  }

  async post(request, response) {
    const { user } = await authorizationProtocol(request, response);
    if (!user) {
      return;
    }

    const guildsId = request.headers.guilds
      ? JSON.parse(request.headers.guilds)
      : null;
  }
}

export default Route;
