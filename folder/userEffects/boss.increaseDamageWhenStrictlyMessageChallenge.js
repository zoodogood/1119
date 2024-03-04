import BossManager from "#lib/modules/BossManager.js";
import { EffectInfluenceEnum } from "#lib/modules/EffectsManager.js";

export default {
  id: "boss.increaseDamageWhenStrictlyMessageChallenge",
  callback: {
    messageCreate: (user, effect, message) => {
      const {
        values: { guildId },
      } = effect;

      const { guild } = message;
      if (guild.id !== guildId) {
        return;
      }

      const { power, multiplayer, goal, basic } = effect.values;
      const userStats = BossManager.getUserStats(
        message.guild.data.boss,
        message.author.id,
      );

      const currentHour = Math.floor(Date.now() / 3_600_000);

      const hoursMap = (effect.values.hoursMap ||= {});

      if (currentHour in hoursMap === false) {
        hoursMap[currentHour] = 0;
        const previousHourMessages = Object.entries(hoursMap)
          .reduce(
            (acc, entrie) => (+acc.at(0) > +entrie.at(0) ? acc : entrie),
            [],
          )
          .at(1);

        if (previousHourMessages === goal) {
          userStats.damagePerMessage ||= 1;
          userStats.damagePerMessage = Math.ceil((power + basic) * multiplayer);
          message.react("685057435161198594");
        }
      }

      hoursMap[currentHour]++;
      if (hoursMap[currentHour] === goal) {
        message.react("998886124380487761");
      }

      if (hoursMap[currentHour] === goal + 1) {
        message.react("🫵");
      }
    },
  },
  values: {
    multiplayer: () => 1,
    power: () => 1.5,
    basic: () => 2,
    goal: () => 30,
    hours: () => {},
    guildId: (user, effect, { guild }) => guild?.id,
  },
  influence: EffectInfluenceEnum.Positive,
};
