import app from "#app";
import BossManager, { BossEffects } from "#lib/modules/BossManager.js";
import CurseManager from "#lib/modules/CurseManager.js";
import { EffectInfluenceEnum } from "#lib/modules/EffectsManager.js";

export default {
  id: "boss.deadlyCurse",
  callback: {
    curseEnd: (user, effect, { curse, isLost }) => {
      const { values } = effect;
      if (values.targetTimestamp !== curse.timestamp) {
        return;
      }
      const { guildId } = values;

      const guild = app.client.guilds.cache.get(guildId);

      if (isLost && BossManager.isArrivedIn(guild)) {
        const userStats = BossManager.getUserStats(guild.data.boss, user.id);
        userStats.heroIsDead = true;
      }

      BossEffects.removeEffect({ effect, user });
    },
    effectInit: (user, effect, { effect: target }) => {
      if (target.uid !== effect.uid) {
        return;
      }
      const { values } = effect;
      const { guildId } = values;
      const guild = app.client.guilds.cache.get(guildId);

      const isShortCurse = (curseBase) => curseBase.interactionIsShort;
      const curseBase = CurseManager.getGeneratePull(user, { guild })
        .filter(isShortCurse)
        .random({ _weights: true });

      const context = { guild };
      const curse = CurseManager.generateOfBase({
        curseBase,
        user,
        context,
      });
      curse.values.timer = values.time;
      CurseManager.init({ curse, user });

      values.targetTimestamp = curse.timestamp;

      const userStats = BossManager.getUserStats(
        guild.data.boss,
        values.keepAliveUserId,
      );
      userStats.alreadyKeepAliveRitualBy = user.id;
    },
    effectRemove: (user, effect, { effect: target }) => {
      if (effect.uid !== target.uid) {
        return;
      }

      const { values } = effect;
      const { guildId } = values;
      const guild = app.client.guilds.cache.get(guildId);

      if (!BossManager.isArrivedIn(guild)) {
        return;
      }
      const userStats = BossManager.getUserStats(guild.data.boss, user.id);

      const targetUser = app.client.users.cache.get(values.keepAliveUserId);
      const targetUserStats = BossManager.getUserStats(
        guild.data.boss,
        values.keepAliveUserId,
      );
      delete targetUserStats.alreadyKeepAliveRitualBy;

      if (userStats.heroIsDead) {
        return;
      }

      delete targetUserStats.heroIsDead;
      targetUser.msg({
        title: "Оповещение в боссе: Вас спасли",
        description: `Герой в маске, || ${user.username} ||, предпочёл выполнить проклятие`,
        thumbnail:
          "https://media.discordapp.net/attachments/629546680840093696/1174372547941384272/skull.png?ex=65675aaa&is=6554e5aa&hm=7472e327ea98eee13d82ea8eb6035483ea655779e235628771991c40f12b7b34&=",
      });
    },
  },
  values: {
    time: () => 60_000 * 5,
    guildId: ({ guild }) => guild?.id,
  },
  influence: EffectInfluenceEnum.Scary,
  canPrevented: false,
};
