import { client } from "#bot/client.js";
import { Actions } from "#lib/modules/ActionManager.js";
import { UserEffectManager } from "#lib/modules/EffectsManager.js";

class Event {
  run(...params) {
    const context = this.getContext(...params);
    const { user, event } = context;

    user.action(Actions.timeEventEffectTimeoutEnd, context);
    if (event.defaultPrevented) {
      return;
    }

    const effect = this.findEffect(context);

    if (!effect) {
      return;
    }
    Object.assign(context, { effect });
    user.action(Actions.effectTimeEnd, context);

    this.removeEffect(context);
  }

  findEffect(context) {
    const { user, uuid } = context;
    const effects = user.data.effects;

    const compare = (effect) => effect.uuid === uuid;
    return effects.find(compare);
  }

  removeEffect(context) {
    const { event, effect, user } = context;
    if (event.defaultPrevented) {
      return;
    }

    UserEffectManager.removeEffect({ effect, user });
  }

  getContext(isLost, userId, uuid) {
    const user = client.users.cache.get(userId);
    if (!user) {
      return;
    }
    const { Event } = globalThis;

    const event = new Event("timeEventCurseTimeoutEnd", {
      cancelable: true,
    });

    const context = {
      isLost,
      uuid,
      event,
      user,
    };

    return context;
  }

  options = {
    name: "TimeEvent/effect-timeout-end",
  };
}

export default Event;
