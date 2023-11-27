import { client } from "#bot/client.js";
import { Actions } from "#lib/modules/ActionManager.js";

class Event {
  run(isLost, userId, timestamp) {
    const user = client.users.cache.get(userId);
    if (!user) {
      return;
    }
    const event = new globalThis.Event("timeEventCurseTimeoutEnd", {
      cancelable: true,
    });
    user.action(Actions.timeEventBossEffectTimeoutEnd, {
      isLost,
      timestamp,
      event,
    });
    if (event.defaultPrevented) {
      return;
    }
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
