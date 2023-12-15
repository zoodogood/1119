import { EffectInfluenceEnum } from "#lib/modules/EffectsManager.js";

export default {
  id: "boss.increaseDamageByAfkTime",
  callback: {
    bossBeforeAttack: (user, effect, data) => {
      const {
        values: { guildId },
      } = effect;

      const { guild } = data;
      if (guild.id !== guildId) {
        return;
      }
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
    guild: ({ guild }) => guild?.id,
  },
  influence: EffectInfluenceEnum.Positive,
};
