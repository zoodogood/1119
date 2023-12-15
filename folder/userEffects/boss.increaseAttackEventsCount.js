import { EffectInfluenceEnum } from "#lib/modules/EffectsManager.js";

export default {
  id: "boss.increaseAttackEventsCount",
  callback: {
    bossBeforeAttack: (user, effect, data) => {
      const { attackContext } = data;
      const { power } = effect.values;
      attackContext.eventsCount += power;
    },
  },
  values: {
    power: () => 1,
  },
  influence: EffectInfluenceEnum.Positive,
};
