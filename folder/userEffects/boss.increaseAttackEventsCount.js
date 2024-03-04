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
      const { power, multiplayer } = effect.values;
      attackContext.eventsCount += Math.floor(power * multiplayer);
    },
  },
  values: {
    multiplayer: () => 1,
    power: () => 1,
    guildId: (user, effect, { guild }) => guild?.id,
  },
  influence: EffectInfluenceEnum.Positive,
};
