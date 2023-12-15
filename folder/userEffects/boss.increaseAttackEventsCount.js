import { EffectInfluenceEnum } from "#lib/modules/EffectsManager.js";

export default {
  id: "boss.increaseAttackEventsCount",
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
      const { power } = effect.values;
      attackContext.eventsCount += power;
    },
  },
  values: {
    power: () => 1,
    guild: ({ guild }) => guild?.id,
  },
  influence: EffectInfluenceEnum.Positive,
};
