import { BossEffects } from "#lib/modules/BossManager.js";
import { EffectInfluenceEnum } from "#lib/modules/EffectsManager.js";

export default {
  id: "boss.decreaseAttackDamage",
  callback: {
    bossBeforeAttack: (user, effect, data) => {
      const { guild, attackContext } = data;
      const {
        values: { guildId },
      } = effect;

      if (guild.id !== guildId) {
        return;
      }
      const { power, multiplayer } = effect.values;
      attackContext.damageMultiplayer *= 1 - power * multiplayer;

      effect.values.repeats--;
      if (!effect.values.repeats) {
        BossEffects.removeEffect({ user, effect });
      }
    },
  },
  values: {
    power: () => 2,
    repeats: () => 1,
    multiplayer: () => 1,
    guildId: (user, effect, { guild }) => guild?.id,
  },
  influence: EffectInfluenceEnum.Negative,
};
