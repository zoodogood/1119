import { BossEffects } from "#lib/modules/BossManager.js";
import CurseManager from "#lib/modules/CurseManager.js";
import { EffectInfluenceEnum } from "#lib/modules/EffectsManager.js";

export default {
  id: "boss.preventEffects",
  callback: {
    bossBeforeEffectInit: (user, effect, context) => {
      const target = context.effect;
      const { values } = effect;
      const effectBase = CurseManager.cursesBase.get(target.id);
      if (
        values.influence &&
        !values.influence.includes(effectBase.influence)
      ) {
        return;
      }

      if (effectBase.canPrevented) {
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
