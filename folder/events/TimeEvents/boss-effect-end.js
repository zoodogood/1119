import { client } from "#bot/client.js";
import { Actions } from "#lib/modules/ActionManager.js";

class Event {
  run(isLost, userId, timestamp) {
    const user = client.users.cache.get(userId);
    const effects = user.data.bossEffects;

    const compare = (effect) => effect.timestamp === timestamp;
    const effect = effects.find(compare);

    if (!effect) {
      return;
    }

    user.action(Actions.bossEffectTimeoutEnd, effect);
  }

  options = {
    name: "TimeEvent/boss-effect-timeout-end",
  };
}

export default Event;
