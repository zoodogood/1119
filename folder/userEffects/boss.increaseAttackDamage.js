import { BossEffects } from "#lib/modules/BossManager.js";
import { EffectInfluenceEnum } from "#lib/modules/EffectsManager.js";

export default {
  id: "boss.increaseAttackDamage",
  callback: {
    bossBeforeAttack: (user, effect, data) => {
      const { guild, attackContext } = data;
      const {
        values: { guildId },
      } = effect;

      if (guild.id !== guildId) {
        return;
      }
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
    guildId: (user, effect, { guild }) => guild?.id,
  },
  influence: EffectInfluenceEnum.Positive,
};
