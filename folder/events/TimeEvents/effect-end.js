import { client } from "#bot/client.js";
import { createDefaultPreventable } from "#lib/createDefaultPreventable.js";
import { Actions } from "#lib/modules/ActionManager.js";
import { UserEffectManager } from "#lib/modules/EffectsManager.js";

class Event {
  run(...params) {
    const context = this.getContext(...params);
    const { user, defaultPrevented } = context;

    user.action(Actions.timeEventEffectTimeoutEnd, context);
    if (defaultPrevented()) {
      return;
    }
    const { effect } = context;
    if (!effect) {
      return;
    }
    Object.assign(context, { effect });
    user.action(Actions.effectTimeEnd, context);

    this.removeEffect(context);
  }

  findEffect(context) {
    const { user, uid } = context;
    const effects = user.data.effects;

    const compare = (effect) => effect.uid === uid;
    return effects.find(compare);
  }

  removeEffect(context) {
    const { defaultPrevented, effect, user } = context;
    if (defaultPrevented()) {
      return;
    }

    UserEffectManager.removeEffect({ effect, user });
  }

  getContext(timeEventData, userId, uid) {
    const user = client.users.cache.get(userId);
    if (!user) {
      return;
    }

    const context = {
      timeEventData,
      uid,
      user,
      ...createDefaultPreventable(),
    };
    context.effect = this.findEffect(context);
    return context;
  }

  options = {
    name: "TimeEvent/effect-end",
  };
}

export default Event;
