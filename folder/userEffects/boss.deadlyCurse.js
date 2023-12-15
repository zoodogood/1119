import app from "#app";
import BossManager, { BossEffects } from "#lib/modules/BossManager.js";
import CurseManager from "#lib/modules/CurseManager.js";
import { EffectInfluenceEnum } from "#lib/modules/EffectsManager.js";

export default {
  id: "boss.deadlyCurse",
  callback: {
    curseEnd: (user, effect, { curse, loses }) => {
      const effectValues = effect.values;

      if (effectValues.targetTimestamp !== curse.timestamp) {
        return;
      }

      const guild = app.client.guilds.cache.get(effect.guildId);

      if (loses && BossManager.isArrivedIn(guild)) {
        const userStats = BossManager.getUserStats(guild.data.boss, user.id);
        userStats.heroIsDead = true;
      }

      BossEffects.removeEffect({ effect, user });
    },
    bossEffectInit: (user, effect, initedEffect) => {
      const effectValues = effect.values;

      if (initedEffect.timestamp !== effect.timestamp) {
        return;
      }
      const guild = app.client.guilds.cache.get(effect.guildId);

      const isShortCurse = (curseBase) => curseBase.interactionIsShort;
      const curseBase = CurseManager.getGeneratePull(user, guild ?? null)
        .filter(isShortCurse)
        .random({ _weights: true });

      const context = { guild };
      const curse = CurseManager.generateOfBase({
        curseBase,
        user,
        context,
      });
      curse.values.timer = effect.values.time;
      CurseManager.init({ curse, user });

      effect.values.targetTimestamp = curse.timestamp;

      if (effectValues.keepAliveUserId) {
        const userStats = BossManager.getUserStats(
          guild.data.boss,
          effectValues.keepAliveUserId,
        );
        userStats.alreadyKeepAliveRitualBy = user.id;
      }
    },
    bossEffectEnd: (user, effect, target) => {
      if (effect.timestamp !== target.timestamp) {
        return;
      }

      const effectValues = effect.values;

      const guild = app.client.guilds.cache.get(effect.guildId);
      if (!BossManager.isArrivedIn(guild)) {
        return;
      }
      const userStats = BossManager.getUserStats(guild.data.boss, user.id);

      if (effectValues.keepAliveUserId) {
        const targetUser = app.client.users.cache.get(
          effectValues.keepAliveUserId,
        );
        const targetUserStats = BossManager.getUserStats(
          guild.data.boss,
          effectValues.keepAliveUserId,
        );
        delete targetUserStats.alreadyKeepAliveRitualBy;
        if (userStats.heroIsDead) {
          return;
        }

        delete targetUserStats.heroIsDead;
        targetUser.msg({
          title: "Оповещение в боссе: вас спасли",
          description: `Герой в маске, || ${user.username} ||, предпочёл выполнить проклятие`,
          thumbnail:
            "https://media.discordapp.net/attachments/629546680840093696/1174372547941384272/skull.png?ex=65675aaa&is=6554e5aa&hm=7472e327ea98eee13d82ea8eb6035483ea655779e235628771991c40f12b7b34&=",
        });
      }
    },
  },
  values: {
    time: () => 60_000 * 5,
  },
  influence: EffectInfluenceEnum.Scary,
  canPrevented: false,
};
