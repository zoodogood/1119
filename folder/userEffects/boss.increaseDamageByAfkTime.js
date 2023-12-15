import { EffectInfluenceEnum } from "#lib/modules/EffectsManager.js";

export default {
  id: "boss.increaseDamageByAfkTime",
  callback: {
    bossBeforeAttack: (user, effect, data) => {
      const { attackContext } = data;
      const { power, lastAttackTimestamp } = effect.values;
      attackContext.damageMultiplayer +=
        (Date.now() - lastAttackTimestamp) * power;

      effect.values.lastAttackTimestamp = Date.now();
    },
  },
  values: {
    power: () => 1 / 100_000,
    lastAttackTimestamp: () => Date.now(),
  },
  influence: EffectInfluenceEnum.Positive,
};
