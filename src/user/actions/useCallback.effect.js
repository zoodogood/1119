import { ActionsMap } from "#src/user/actions/actionsMap.enum.js";
import UserEffectManager from "#src/user/actions/EffectsManager.js";

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
