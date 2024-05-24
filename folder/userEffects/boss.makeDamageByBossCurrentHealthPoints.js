import { current_health } from "#folder/entities/boss/boss.js";
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

      const currentHealth = current_health(boss);
      const damage = Math.floor(currentHealth * power * multiplayer);
      attackContext.addableDamage += damage;
    },
  },
  values: {
    multiplayer: () => 1,
    power: () => 0.001,
    guildId: (user, effect, { guild }) => guild?.id,
  },
  influence: EffectInfluenceEnum.Positive,
};
