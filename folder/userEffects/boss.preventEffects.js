import { BossEffects } from "#lib/modules/BossManager.js";
import CurseManager from "#lib/modules/CurseManager.js";
import { EffectInfluenceEnum } from "#lib/modules/EffectsManager.js";

function isBossEffect(effect) {
  return effect.id.startsWith("boss.");
}

export default {
  id: "boss.preventEffects",
  callback: {
    bossBeforeEffectInit: (user, effect, context) => {
      const { effect: target } = context;
      const { values } = effect;
      const effectBase = CurseManager.cursesBase.get(target.id);
      if (
        values.influence &&
        !values.influence.includes(effectBase.influence)
      ) {
        return;
      }

      if (!isBossEffect(effect)) {
        return;
      }

      if (effectBase.canPrevented === false) {
        return;
      }

      values.count--;
      context.preventDefault();
      if (!effect.values.count) {
        BossEffects.removeEffect({ user, effect });
      }
    },
  },
  values: {
    count: () => 1,
  },
  influence: EffectInfluenceEnum.Positive,
};
