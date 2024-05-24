import { current_health } from "#folder/entities/boss/health.js";
import { EffectInfluenceEnum } from "#lib/modules/EffectsManager.js";

export default {
  id: "boss.increaseDamageByBossCurrentHealthPoints",
  callback: {
    bossBeforeAttack: (user, effect, data) => {
      const {
        values: { guildId },
      } = effect;

      const { guild } = data;
      if (guild.id !== guildId) {
        return;
      }

      const { attackContext, boss } = data;
      const { power, multiplayer } = effect.values;

      const thresholder = current_health(boss);
      const currentHealth = thresholder - boss.damageTaken;
      const damage = Math.floor(currentHealth * power * multiplayer);
      attackContext.baseDamage += damage;
    },
  },
  values: {
    multiplayer: () => 1,
    power: () => 0.001,
    guildId: (user, effect, { guild }) => guild?.id,
  },
  influence: EffectInfluenceEnum.Positive,
};
