import { EffectInfluenceEnum } from "#lib/modules/EffectsManager.js";

export default {
  id: "boss.increaseDamageForBoss",
  callback: {
    bossBeforeAttack: (user, effect, data) => {
      const {
        values: { guildId },
      } = effect;

      const { guild } = data;
      if (guild.id !== guildId) {
        return;
      }

      const { boss } = data;
      const { power } = effect.values;
      boss.legendaryWearonDamageMultiplayer ||= 1;
      boss.legendaryWearonDamageMultiplayer += power;
    },
  },
  values: {
    power: () => 1 / 100_000,
    guildId: (user, effect, { guild }) => guild?.id,
  },
  influence: EffectInfluenceEnum.Positive,
};
