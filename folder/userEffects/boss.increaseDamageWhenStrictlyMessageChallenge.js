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
      const values = effect.values;
      const userStats = BossManager.getUserStats(
        message.guild.data.boss,
        message.author.id,
      );

      const currentHour = Math.floor(Date.now() / 3_600_000);

      const hoursMap = (values.hoursMap ||= {});

      if (currentHour in hoursMap === false) {
        hoursMap[currentHour] = 0;
        const previousHourMessages = Object.entries(hoursMap)
          .reduce(
            (acc, entrie) => (+acc.at(0) > +entrie.at(0) ? acc : entrie),
            [],
          )
          .at(1);

        if (previousHourMessages === values.goal) {
          userStats.damagePerMessage = Math.ceil(
            (userStats.damagePerMessage || 1) * values.power + values.basic,
          );
          message.react("685057435161198594");
        }
      }

      hoursMap[currentHour]++;
      if (hoursMap[currentHour] === values.goal) {
        message.react("998886124380487761");
      }

      if (hoursMap[currentHour] === values.goal + 1) {
        message.react("🫵");
      }
    },
  },
  values: {
    power: () => 1.5,
    basic: () => 2,
    goal: () => 30,
    hours: () => {},
    guild: ({ guild }) => guild?.id,
  },
  influence: EffectInfluenceEnum.Positive,
};
