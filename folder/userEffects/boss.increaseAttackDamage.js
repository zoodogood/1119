import { BossEffects } from "#lib/modules/BossManager.js";
import { EffectInfluenceEnum } from "#lib/modules/EffectsManager.js";

export default {
  id: "boss.increaseAttackDamage",
  callback: {
    bossBeforeAttack: (user, effect, { attackContext }) => {
      attackContext.damageMultiplayer *= effect.values.power;

      effect.values.duration--;
      if (!effect.values.duration) {
        BossEffects.removeEffect({ user, effect });
      }
    },
  },
  values: {
    power: 2,
    duration: 1,
  },
  influence: EffectInfluenceEnum.Positive,
};
