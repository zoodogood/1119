import { ActionsMap } from "#constants/enums/actionsMap.js";
import { BaseContext } from "#lib/BaseContext.js";
import { createDefaultPreventable } from "#lib/createDefaultPreventable.js";
import { TimeEventsManager } from "#lib/modules/mod.js";
import * as Utils from "#lib/util.js";
import { Collection } from "@discordjs/collection";
import { ImportDirectory } from "@zoodogood/import-directory";
const EFFECTS_PATH = "./folder/userEffects";
const EffectInfluenceEnum = {
  Negative: "Negative",
  Neutral: "Neutral",
  Positive: "Positive",
  Scary: "Scary",
  Nothing: "Nothing",
};

class Core {
  /**
   * @type {Collection<string, BaseEffect>}
   */
  static store = new Collection();

  static createOfBase({ effectBase, user, context = {} }) {
    const effect = {
      id: effectBase.id,
      uid: Utils.uid(),
      createdAt: Date.now(),
      values: {},
    };

    for (const [key, valueField] of Object.entries(effectBase.values)) {
      const value =
        typeof valueField === "function"
          ? valueField(user, effect, context)
          : valueField;

      effect.values[key] = value;
    }

    return effect;
  }

  static applyEffect({ effect, effectBase, user, context }) {
    const effects = (user.data.effects ||= []);
    const callbackMap = (user.data.effectsCallbackMap ||= {});

    Object.keys(effectBase.callback).forEach((callbackKey) => {
      callbackMap[callbackKey] = true;
    });

    const _context = new BaseContext(
      `effectsManager.applyEffect.${effect.id}`,
      context,
    );
    Object.assign(_context, { effect, ...createDefaultPreventable() });
    user.action(ActionsMap.beforeEffectInit, _context);

    if (_context.defaultPrevented()) {
      return;
    }

    if (effect.values.timer) {
      const params = [user.id, effect.uid];
      TimeEventsManager.create(
        "effect-timeout-end",
        effect.values.timer,
        params,
      );
    }

    effects.push(effect);
    user.action(ActionsMap.effectInit, _context);
    return _context;
  }

  static cleanCallbackMap(user) {
    const effects = user.data.effects;
    if (!user.data.effectsCallbackMap) {
      return;
    }

    const needRemove = (callbackKey) =>
      !effects.some(({ id }) => callbackKey in Core.store.get(id).callback);
    const callbackMap = user.data.effectsCallbackMap;
    Object.keys(callbackMap)
      .filter(needRemove)
      .forEach((key) => delete callbackMap[key]);
  }

  static removeEffect({ effect, user }) {
    Core.setRemoved(effect, true);

    const index = user.data.effects.indexOf(effect);
    if (index === -1) {
      return null;
    }

    user.action(ActionsMap.effectRemove, { effect, index });
    user.data.effects.splice(index, 1);
  }

  static setRemoved(effect, value) {
    effect.isRemoved = value;
  }

  static setDisabled(effect, value) {
    effect.isDisabled = value;
  }
}

class EffectInterface {
  setDisabled(value) {
    Core.setDisabled(this.effect, value);
  }

  setRemoved(value) {
    Core.setRemoved(this.effect, value);
  }

  remove() {
    const { user, effect } = this;
    Core.removeEffect({ effect, user });
  }

  static from(data) {
    return Object.assign(Object.create(EffectInterface.prototype), data);
  }
}

class UserEffectManager {
  static interface({ user, effect }) {
    return EffectInterface.from({ user, effect });
  }

  static removeEffects({ list, user }) {
    for (const effect of list) {
      this._removeEffect({ effect, user });
    }

    this.cleanCallbackMap(user);
  }

  static removeEffect({ effect, user }) {
    this.removeEffects({ list: [effect], user });
  }

  static indexOf({ user, effect }) {
    return this.effectsOf({ user }).indexOf(effect);
  }

  static effectsOf({ user }) {
    return user.data.effects || [];
  }

  static registerEffect(base) {
    const { id } = base;
    this.store.set(id, base);
  }

  static justEffect({
    effectId,
    user,
    values = {},
    context = {},
    call = true,
  }) {
    const effectBase = this.store.get(effectId);
    const effect = this.createOfBase({ effectBase, user, context });
    Object.assign(effect.values, values);
    return call && this.applyEffect({ effect, effectBase, user, context });
  }

  static async importEffects() {
    const effects = (await new ImportDirectory().import(EFFECTS_PATH)).map(
      ({ default: effectBase }) => new BaseEffect(effectBase),
    );

    for (const effect of effects) {
      this.registerEffect(effect);
    }
  }

  static _removeEffect = Core.removeEffect;
  static createOfBase = Core.createOfBase;
  static applyEffect = Core.applyEffect;
  static cleanCallbackMap = Core.cleanCallbackMap;
  static store = Core.store;
}

class BaseEffect {
  constructor(data) {
    Object.assign(this, data);
    data.onConstruct?.();
  }
  /** @type {string} */
  id;
  /**
   * @property {number} [timer]
   */
  values = {};
  /**
   * @type {Record<keyof typeof ActionsMap, (user: import("discord.js").User, effect: {}, data: {}) => unknown>}
   */
  callback = {};
  /** @type {boolean?} */
  canPrevented;
}

export default UserEffectManager;
export { UserEffectManager, EffectInfluenceEnum, BaseEffect };
