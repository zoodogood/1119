import { ActionsMap } from "#constants/enums/actionsMap.js";
import { UserEffectManager } from "#lib/modules/EffectsManager.js";

export default {
  id: "useCallback",
  callback: {
    [ActionsMap.any](user, effect, { actionName, data }) {
      const { callback } = effect.values;
      if (typeof callback !== "function") {
        UserEffectManager.interface({ effect, user }).setDisabled(true);
        UserEffectManager.removeEffect({ effect, user });
        return;
      }

      callback(user, effect, { actionName, data });
    },
    canPrevented: false,
  },
};
