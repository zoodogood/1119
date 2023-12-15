import BossManager from "#lib/modules/BossManager.js";
import { EffectInfluenceEnum } from "#lib/modules/EffectsManager.js";

export default {
  id: "boss.increaseDamageByBossCurrentHealthPoints",
  callback: {
    bossBeforeAttack: (user, effect, data) => {
      const { attackContext, boss } = data;
      const { power } = effect.values;

      const thresholder = BossManager.calculateHealthPointThresholder(
        boss.level,
      );
      const currentHealth = thresholder - boss.damageTaken;
      const damage = Math.floor(currentHealth * power);
      attackContext.baseDamage += damage;
    },
  },
  values: {
    power: () => 0.001,
  },
  influence: EffectInfluenceEnum.Positive,
};
