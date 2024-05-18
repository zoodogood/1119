import { BossEffects } from "#lib/modules/BossManager.js";
import UserEffectManager, {
  EffectInfluenceEnum,
} from "#lib/modules/EffectsManager.js";

function isBossEffect(effect) {
  return effect.id.startsWith("boss.");
}

export default {
  id: "boss.preventEffects",
  callback: {
    bossBeforeEffectInit: (user, preventer, context) => {
      const {
        values: { guildId },
      } = preventer;

      const { guild } = context;
      if (guild.id !== guildId) {
        return;
      }
      const { effect: target } = context;
      const { values } = target;
      const effectBase = UserEffectManager.store.get(target.id);
      if (
        values.influence &&
        !values.influence.includes(effectBase.influence)
      ) {
        return;
      }

      if (!isBossEffect(preventer)) {
        return;
      }

      if (effectBase.canPrevented === false || values.canPrevented === false) {
        return;
      }

      preventer.values.count--;
      context.preventDefault();
      if (!preventer.values.count) {
        BossEffects.removeEffect({ user, effect: preventer });
      }
    },
  },
  values: {
    count: () => 1,
    guildId: (user, effect, { guild }) => guild?.id,
  },
  influence: EffectInfluenceEnum.Neutral,
};
