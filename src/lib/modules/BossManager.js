/* eslint-disable no-unused-vars */

import app from "#app";
import { ActionsMap } from "#constants/enums/actionsMap.js";
import { NOT_BREAKING_SPACE } from "#constants/globals/characters.js";
import { DAY, HOUR, MINUTE, MONTH } from "#constants/globals/time.js";
import { elementsEnum } from "#folder/commands/thing.js";
import {
  core_make_attack,
  core_make_attack_context,
  display_attack,
  process_before_attack,
  update_attack_cooldown,
  update_attack_damage_multiplayer,
} from "#folder/entities/boss/attack.js";
import {
  attack_event_callback,
  resolve_attack_events_pull,
} from "#folder/entities/boss/attack_events.js";
import { eventBases } from "#folder/entities/boss/events.js";
import { RewardSystem } from "#folder/entities/boss/reward.js";
import { createDefaultPreventable } from "#lib/createDefaultPreventable.js";
import { UserEffectManager } from "#lib/modules/EffectsManager.js";
import { DataManager, Properties } from "#lib/modules/mod.js";
import {
  NumberFormatLetterize,
  ending,
  numberFormat,
  random,
  sleep,
  timestampDay,
  timestampToDate,
  toFixedAfterZero,
} from "#lib/util.js";
import { update_health_thresholder } from "#root/folder/entities/boss/health.js";
import { Collection } from "@discordjs/collection";
import { ButtonStyle, ComponentType } from "discord.js";

class Speacial {
  static AVATAR_OF_SNOW_QUEEN =
    "https://media.discordapp.net/attachments/926144032785195059/1189474240974565436/b9183b53bdf18835d4c337f06761d95d_1400x790-q-85_1_1.webp?ex=659e4b36&is=658bd636&hm=0889765cc144e316843ab5ad88144db1ae96f9c21f4747f303860d647200cf00&=&format=webp";

  static LegendaryWearonList = new Collection(
    Object.entries({
      afkPower: {
        description: "Урон ваших атак будет расти за время простоя",
        effect: "boss.increaseDamageByAfkTime",
        emoji: "❄️",
        values: {
          power: () => 1 / (MINUTE * 10),
        },
      },
      percentDamage: {
        description:
          "Дополнительный урон атак равен 0.03% от текущего здоровья босса",
        effect: "boss.makeDamageByBossCurrentHealthPoints",
        emoji: "🩸",
        values: {
          power: () => 0.003,
        },
      },
      manyEvent: {
        description: "Увеличивает количество событий атаки на 3",
        effect: "boss.increaseAttackEventsCount",
        emoji: "✨",
        values: {
          power: () => 3,
        },
      },
      togetherWeAre: {
        description:
          "Каждая ваша атака увеличивает урон по боссу независимо от кубика",
        effect: "boss.increaseDamageForBoss",
        emoji: "💧",
        values: {
          power: () => 0.0005,
        },
      },
      complexWork: {
        description:
          "Отправляйте строго по 30 сообщений в час, чтобы на следующий период времени получить прибавку к урону",
        effect: "boss.increaseDamageWhenStrictlyMessageChallenge",
        emoji: "🎈",
        values: {
          power: () => 1.1,
          basic: () => 20,
        },
      },
    }),
  );

  static findMostDamageDealtUser(boss) {
    const damageOf = (entrie) => entrie[1].damageDealt;
    const [id] = Object.entries(boss.users).reduce((previous, compare) =>
      damageOf(compare) > damageOf(previous) ? compare : previous,
    );
    return app.client.users.cache.get(id);
  }

  static isSnowQueen(boss) {
    return boss.avatarURL === Speacial.AVATAR_OF_SNOW_QUEEN;
  }
}

class AttributesShop {
  static PRODUCTS = new Collection(
    Object.entries({
      "🧩": {
        emoji: "🧩",
        keyword: "puzzle",
        description: "Множитель атаки: 1.25",
        basePrice: 200,
        priceMultiplayer: 2,
        resource: "coins",
        callback: (context) => {
          const multiplayer = 1.25;
          const { user, boss } = context;
          update_attack_damage_multiplayer(
            user,
            boss,
            "",
            context,
            (previous) => previous * multiplayer,
          );
        },
      },
      "🐺": {
        emoji: "🐺",
        keyword: "wolf",
        description: "Перезарядка атаки в 2 раза меньше",
        basePrice: 50,
        priceMultiplayer: 1.75,
        resource: "coins",
        callback: (context) => {
          const { userStats, user, boss } = context;
          update_attack_cooldown(user, boss, "", context, (current) =>
            Math.floor(current / 2),
          );
        },
      },
      "📡": {
        emoji: "📡",
        keyword: "anntena",
        description: "На 1 больше урона за сообщение",
        basePrice: 1,
        priceMultiplayer: 2,
        resource: "keys",
        callback: ({ userStats }) => {
          userStats.damagePerMessage ||= 1;
          userStats.damagePerMessage += 1;
        },
      },
      "🎲": {
        emoji: "🎲",
        keyword: "dice",
        description: "Урон участников сервера на 1% эффективнее",
        basePrice: 10,
        priceMultiplayer: 5,
        resource: "coins",
        callback: ({ boss }) => {
          boss.diceDamageMultiplayer ||= 1;
          boss.diceDamageMultiplayer += 0.01;
        },
      },
    }),
  );

  static calculatePrice({ product, boughtCount }) {
    const grossPrice =
      product.basePrice * product.priceMultiplayer ** (boughtCount ?? 0);
    const price =
      grossPrice > 30 ? Math.floor(grossPrice - (grossPrice % 5)) : grossPrice;
    return price;
  }

  static async createShop({ guild, channel, user }) {
    const boss = guild.data.boss;

    const userStats = BossManager.getUserStats(boss, user.id);
    const boughtMap = (userStats.bought ||= {});

    const createEmbed = ({ boss, user, edit }) => {
      const data = user.data;

      const getDescription = (product) =>
        typeof product.description === "function"
          ? product.description({ userStats, boss, user, product })
          : product.description;

      const productsContent = this.PRODUCTS.map((product) => ({
        label: `${product.emoji} — ${getDescription(product)}.`,
        price: this.calculatePrice({
          product,
          boughtCount: this.getBoughtCount({ userStats, product }),
        }),
        product,
      }))
        .map(
          ({ label, price, product }) =>
            `${label}\n${NumberFormatLetterize(price)} ${Properties.endingOf(
              product.resource,
              price,
            )};`,
        )
        .join("\n");

      const descriptionContent = `Приобретите эти товары! Ваши экономические возможности:\n${ending(
        data.coins,
        "монет",
        "",
        "а",
        "ы",
        {
          unite: (value, end) =>
            `${numberFormat(value)}${NOT_BREAKING_SPACE}${end}`,
        },
      )} <:coin:637533074879414272> и ${ending(
        data.keys,
        "ключ",
        "ей",
        "",
        "а",
        {
          unite: (value, end) =>
            `${numberFormat(value)}${NOT_BREAKING_SPACE}${end}`,
        },
      )} 🔩 на руках`;
      const description = `${descriptionContent}\n\n${productsContent}`;

      return {
        title: "Тайная лавка Гремпенса",
        author: { name: user.username, iconURL: user.avatarURL() },
        description,
        edit,
        reactions: edit
          ? []
          : [
              ...this.PRODUCTS.filter((product) =>
                this.isUserCanBuyProduct({ user, product, userStats }),
              ).map(({ emoji }) => emoji),
            ],
      };
    };

    let message = await channel.msg(createEmbed({ boss, user, edit: false }));
    const filter = (_reaction, member) => user.id === member.id;
    const collector = message.createReactionCollector({ filter, time: 60_000 });

    collector.on("collect", async (reaction, user) => {
      reaction.users.remove(user);
      const product = this.PRODUCTS.get(reaction.emoji.name);
      const currentBought = this.getBoughtCount({ userStats, product });

      const price = this.calculatePrice({
        product,
        boughtCount: currentBought,
      });

      if (!this.isUserCanBuyProduct({ user, product, userStats })) {
        message.msg({ title: "Недостаточно средств!", delete: 3000 });
        reaction.remove();
        return;
      }

      product.callback({ user, userStats, boss, product });
      boughtMap[product.keyword] = currentBought + 1;
      user.data[product.resource] -= price;
      message.msg({ description: `${product.emoji} +1`, delete: 7000 });
      message = await message.msg(createEmbed({ boss, user, edit: true }));
    });

    collector.on("end", () => message.reactions.removeAll());
  }

  static getBoughtCount({ userStats, product }) {
    const boughtMap = userStats.bought ?? {};
    return boughtMap[product.keyword] || 0;
  }

  static isUserCanBuyProduct({ user, product, userStats }) {
    return (
      user.data[product.resource] >=
      this.calculatePrice({
        product,
        boughtCount: this.getBoughtCount({ userStats, product }),
      })
    );
  }
}

class BossEvents {
  static events = new Collection(
    Object.entries({
      bossNowHeals: {
        id: "bossNowHeals",
        callback() {
          // to-do
        },
      },
      notifyLevel10: {
        id: "notifyLevel10",
        callback(boss, context) {
          const now = Date.now();
          const contents = {
            time: timestampToDate(
              now -
                (boss.endingAtDay - BossManager.BOSS_DURATION_IN_DAYS - 1) *
                  DAY,
            ),
          };
          const description = `**10-й уровень за ${contents.time}**\n\nС момента достижения этого уровня босс станет сложнее, а игроки имеют шанс получить осколки реликвий. Соберите 5 штук, чтобы получить случайную из реликвий`;
          const guild = app.client.guilds.cache.get(boss.guildId);

          guild.chatSend({
            description,
            color: BossManager.MAIN_COLOR,
          });
        },
      },

      questFirstTimeKillBoss: {
        id: "questFirstTimeKillBoss",
        callback(boss, context) {
          const { sourceUser } = context;
          sourceUser.action(ActionsMap.globalQuest, {
            name: "firstTimeKillBoss",
          });
        },
      },

      checkQuestAloneKill: {
        id: "checkQuestAloneKill",
        callback(boss, context) {
          const { sourceUser } = context;
          const hasImpostor = Object.entries(boss.users).some(
            ([id, { damageDealt }]) => damageDealt && id !== sourceUser.id,
          );

          if (hasImpostor) {
            return;
          }

          sourceUser.action(ActionsMap.globalQuest, { name: "killBossAlone" });
        },
      },
    }),
  );

  static afterAttacked(boss, context) {}

  static beforeAttacked(boss, context) {}

  static beforeDeath(boss, context) {
    const MAXIMUM_LEVEL = BossManager.MAXIMUM_LEVEL;
    const isDefeatTransition =
      boss.level < MAXIMUM_LEVEL && context.possibleLevels > MAXIMUM_LEVEL;
    if (isDefeatTransition) {
      boss.damageTaken =
        BossManager.calculateHealthPointThresholder(MAXIMUM_LEVEL);
      context.possibleLevels = MAXIMUM_LEVEL;
    }
    return;
  }

  static onBossDeath(boss, context) {
    const { fromLevel, toLevel } = context;
    const levels = [...new Array(toLevel - fromLevel)].map(
      (_, i) => i + fromLevel,
    );

    const modFive = levels.find((level) => level % 5 === 0);
    if (modFive) {
      this.events.get("bossNowHeals").callback(boss, context);
    }

    const precedesTen = levels.find((level) => level - 1 === 10);
    if (precedesTen) {
      this.events.get("notifyLevel10").callback(boss, context);
    }

    if (precedesTen) {
      this.events.get("checkQuestAloneKill").callback(boss, context);
    }

    this.events.get("questFirstTimeKillBoss").callback(boss, context);
  }

  static onTakeDamage(boss, context) {}
}

class BossEffects {
  /**
   * @type {Collection<string, import("#lib/modules/EffectsManager.js").BaseEffect>}
   */
  static effectBases;

  static applyEffect({ effectId, guild = null, user, values = {} }) {
    const effectBase = this.effectBases.get(effectId);

    const effect = UserEffectManager.createOfBase({
      effectBase,
      user,
      context: { guild },
    });

    Object.assign(effect.values, values, { guildId: guild.id });

    const context = {
      guild,
      effect,
      ...createDefaultPreventable(),
    };
    user.action(ActionsMap.bossBeforeEffectInit, context);
    if (context.defaultPrevented()) {
      return context;
    }

    const applyContext = UserEffectManager.applyEffect({
      effect,
      effectBase,
      user,
      context,
    });
    if (applyContext.defaultPrevented()) {
      return applyContext;
    }
    user.action(ActionsMap.bossEffectInit, context);
    return applyContext;
  }

  static cleanCallbackMap(user) {
    UserEffectManager.cleanCallbackMap(user);
  }

  static effectsOf({ boss, user }) {
    return UserEffectManager.effectsOf({ user }).filter(
      (effect) =>
        effect.id.startsWith("boss.") && effect.values.guildId === boss.guildId,
    );
  }

  static removeEffect({ effect, user }) {
    this.removeEffects({ list: [effect], user });
  }

  static removeEffects({ list, user }) {
    for (const effect of list) {
      this._removeEffect({ effect, user });
    }
  }

  static updateBasesFromManager() {
    this.effectBases = new Collection(
      UserEffectManager.store
        .filter((value) => value.id.startsWith("boss."))
        .entries(),
    );
  }

  static _removeEffect({ effect, user }) {
    const index = UserEffectManager.indexOf({ effect, user });
    if (index === -1) {
      return null;
    }

    user.action(ActionsMap.bossEffectEnd, { effect, index });
    UserEffectManager.removeEffect({ effect, user });
  }
}

class Relics {
  static collection = new Collection(
    Object.entries({
      destroy: {
        id: "destroy",
        label: "Техномагия",
        description: "Дарует способность: позволяет единожды уничтожить босса",
        onBought: () => {},
      },
      helper: {
        id: "helper",
        label: "Молочко",
        description:
          "Дарует способность: снимает негативные эффекты с упомянутого пользователя",
        onBought: () => {},
      },
      dealt: {
        id: "dealt",
        label: "Сильная атака",
        description:
          "Новая способность с перезарядкой в 4 часа: наносит ровно 10% от здоровья босса",
        onBought: () => {},
      },
      timeSecrets: {
        id: "timeSecrets",
        label: "Управление временем",
        description:
          "Классическое событие увеличивающее перезарядку больше на вас не действует",
        onBought: () => {},
      },
      mastery: {
        id: "mastery",
        label: "Поглатить",
        description:
          "Дарует способность поглатить другого воина, его урон и перезарядку атаки",
        onBought: () => {},
      },
      pestsKing: {
        id: "pestsKing",
        label: "Король клопов",
        description: "Навык призыва клопов — худшый навык",
        onBought: () => {},
      },
      toy: {
        id: "toy",
        label: "Игрушка",
        description: "Ничего не делает",
        onBought: () => {},
      },
      defiance: {
        id: "defiance",
        label: "Непокорность",
        description: "Ваши атаки никогда не лечат босса",
        onBought: () => {},
      },
      watcher: {
        id: "watcher",
        label: "Наблюдательный",
        description: "Вы можете получать дополнительные сведения о боссе",
        onBought: () => {},
      },
    }),
  );

  static calculatePriceForRelic({ boss, user }) {
    const userStats = BossManager.getUserStats(boss, user.id);
    const relicsBought = userStats.boughedRelics?.length;
    const price = Math.round(350 - 349 * (1 / 1.0135) ** relicsBought);
    return price;
  }

  static isUserHasRelic({ relic, userData }) {
    return !!userData.bossRelics?.includes(relic.id);
  }
}

class BossManager {
  static BonusesChest = {
    RECEIVE_LIMIT: 20,
    MAIN_COLOR: "#ffda73",

    createEmbed: ({ fromLevel, toLevel, taking }) => {
      const contents = {
        rewardPer: `Получите бонусы за победу над боссом ур. ${toLevel - 1}`,
        timeLimit: `Время ограничено двумя часами с момента отправки этого сообщения`,
        receiveLimit: `${
          taking
            ? `\nСобрано: ${taking}/${BossManager.BonusesChest.RECEIVE_LIMIT}`
            : ""
        }`,
      };
      return {
        title: "Сундук с наградами",
        description: `${contents.rewardPer}\n${contents.timeLimit}.${contents.receiveLimit}`,
        thumbnail:
          "https://media.discordapp.net/attachments/629546680840093696/1038767024643522600/1476613756146739089.png?width=593&height=593",
        footer: {
          text: "Внимание, вы можете получить награду не более чем из одного сундука за время пребывания босса",
        },
        color: BossManager.BonusesChest.MAIN_COLOR,
        reactions: ["637533074879414272"],
      };
    },
    createCollector: async ({ guild, toLevel, fromLevel }) => {
      const BossChest = BossManager.BonusesChest;

      const embed = BossChest.createEmbed({ toLevel, fromLevel, taking: 0 });
      const context = {
        taking: 0,
        toLevel,
        fromLevel,
        message: null,
        guild,
      };

      context.message = await guild.chatSend(embed);
      if (!context.message) {
        return;
      }

      const filter = (reaction, user) =>
        !user.bot && reaction.emoji.id === "637533074879414272";
      const collector = context.message.createReactionCollector({
        filter,
        time: HOUR * 2,
      });
      collector.on("collect", (reaction, user) => {
        const result = BossChest.onCollect(user, context, reaction);
        if (!result) {
          return;
        }
        context.taking++;
        if (context.taking >= BossChest.RECEIVE_LIMIT) {
          collector.stop();
        }
        context.message.msg({ ...BossChest.createEmbed(context), edit: true });
      });

      collector.on("end", () => context.message.delete());
    },
    onCollect: (user, context, reaction = null) => {
      const { toLevel, message, guild } = context;
      const boss = guild.data.boss;
      if (!boss) {
        message.msg({
          title: `Босса нет!`,
          delete: 5_000,
          footer: { text: user.username, avatarURL: user.avatarURL() },
        });
        reaction?.remove();
        return;
      }
      const userStats = BossManager.getUserStats(boss, user.id);

      if ("chestRewardAt" in userStats) {
        message.msg({
          title: `Вы уже взяли награду на ур. ${userStats.chestRewardAt}`,
          delete: 5000,
        });
        reaction?.users.remove(user);
        return;
      }

      const { Chest } = RewardSystem;

      const rewardPull = Chest.resources({ userStats, level: toLevel });
      RewardSystem.sendReward(
        {
          user,
          executor: user,
          source: "bossManager.chest.onCollect",
          context,
        },
        rewardPull,
      );

      userStats.chestRewardAt = toLevel;
      message.msg({
        description: `Получено ${ending(
          rewardPull.chestBonus,
          "бонус",
          "ов",
          "",
          "а",
        )} для сундука <a:chest:805405279326961684> и ${rewardPull.keys} 🔩`,
        color: BossManager.BonusesChest.MAIN_COLOR,
        delete: 7000,
      });

      return true;
    },
  };
  static BOSS_DURATION_IN_DAYS = 3;
  static BOSS_TYPES = new Collection(
    Object.entries({
      earth: {
        key: "earth",
        type: elementsEnum.earth,
      },
      wind: {
        key: "wind",
        type: elementsEnum.wind,
      },
      fire: {
        key: "fire",
        type: elementsEnum.fire,
      },
      darkness: {
        key: "darkness",
        type: elementsEnum.darkness,
      },
    }),
  );
  static BossEffects = BossEffects;

  static BossEvents = BossEvents;

  static BossRelics = Relics;

  static BossShop = AttributesShop;

  static DAMAGE_SOURCES = {
    message: 0,
    attack: 1,
    thing: 2,
    other: 3,
    0: {
      label: "Сообщения",
      key: "message",
    },
    1: {
      label: "Прямые атаки",
      key: "attack",
    },
    2: {
      label: "Штука",
      key: "thing",
    },
    3: {
      label: "Другое",
      key: "other",
    },
  };

  static ELITE_MAIN_COLOR = "";

  static MAIN_COLOR = "";

  static MAXIMUM_LEVEL = 100;

  static Speacial = Speacial;

  static USER_DEFAULT_ATTACK_COOLDOWN = HOUR * 2;

  static USER_DEFAULT_ATTACK_DAMAGE = 10;

  static async beforeApparance(guild) {
    const data = guild.data;

    if (!data.boss) {
      return;
    }

    const isApparanceAtNextDay = () => {
      return data.boss.apparanceAtDay === DataManager.data.bot.currentDay + 1;
    };

    if (!isApparanceAtNextDay()) {
      return;
    }

    await sleep(3000);

    const descriptionImage = `Настоящий босс — это здравый смысл внутри каждого из нас. И всем нам предстоит с ним сразится.`;
    const descriptionFacts = `<a:bigBlack:829059156069056544> С завтрашенего дня, в течении трёх дней, босс будет проходить по землям сервера в определенном образе. За это время нанесите как можно больше урона.\nПосле его появления на сервере будет доступна команда **!босс**, а по завершении участники получат небольшую награду`;
    const description = `${descriptionImage}\n\n${descriptionFacts}`;

    const embed = {
      color: "#210052",
      description,
    };

    await guild.chatSend(embed);
  }

  static async beforeEnd(guild) {
    const boss = guild.data.boss;
    const usersCache = guild.client.users.cache;

    if (boss.level > 1 === false) {
      guild.chatSend({ content: "Босс покинул сервер в страхе..." });
      return;
    }

    const DAMAGE_THRESHOLDER_FOR_REWARD = 1_500;
    const { BossEndPull, GuildHarvest, MostStrongUser, LevelKill, sendReward } =
      RewardSystem;

    const mostStrongUser = (() => {
      const pull = MostStrongUser.resources();
      const { findMostDamageDealtUser } = Speacial;
      const user = findMostDamageDealtUser(boss);
      sendReward(
        {
          source: "bossManager.beforeEnd.mostStrongUser",
          user,
          context: { boss },
          executor: null,
        },
        pull,
      );
      return user;
    })();

    const sendReward_ = ([id, userStats]) => {
      const user = usersCache.get(id);
      const rewardPull = BossEndPull.resources({
        userStats,
        level: boss.level,
      });
      sendReward(
        {
          user,
          executor: null,
          source: "bossManager.beforeEnd.bossEndPull",
          context: { boss, rewardPull },
        },
        rewardPull,
      );
    };

    const cleanEffects = (user) => {
      const list = BossEffects.effectsOf({ user, boss });
      BossEffects.removeEffects({ list, user });
    };

    const context = {
      guild,
      boss,
      mostStrongUser,
      usersStatsEntries: Object.entries(boss.users),
    };

    this.eventBases.get("andWhoStronger").onBossEnd(context);
    GuildHarvest.onBossEnded(guild, boss);

    const { usersStatsEntries } = context;

    usersStatsEntries
      .filter(
        ([_id, { damageDealt }]) => damageDealt > DAMAGE_THRESHOLDER_FOR_REWARD,
      )
      .forEach(sendReward_);

    usersStatsEntries
      .map(([id]) => usersCache.get(id))
      .forEach((user) => user && cleanEffects(user));

    const mainDamage = Object.entries(boss.stats.damage).reduce(
      (acc, current) => (acc.at(1) > current.at(1) ? acc : current),
      [BossManager.DAMAGE_SOURCES.other, 0],
    );

    const weakestDamage = Object.entries(boss.stats.damage).reduce(
      (acc, current) => (acc.at(1) < current.at(1) ? acc : current),
      [BossManager.DAMAGE_SOURCES.other, Number.MAX_SAFE_INTEGER],
    );

    const participants = usersStatsEntries.filter(
      ([id, { damageDealt }]) => damageDealt,
    );

    const contents = {
      dice: `Максимальный множитель урона от эффектов: Х${this.calculateBossDamageMultiplayer(
        boss,
      ).toFixed(2)};`,
      bossLevel: `Достигнутый уровень: ${
        boss.level
      } (${LevelKill.calculateKillExpReward({
        fromLevel: 1,
        toLevel: boss.level,
      })} опыта)`,
      damageDealt: `Совместными усилиями участники сервера нанесли **${NumberFormatLetterize(
        boss.damageTaken,
      )}** ед. урона`,
      mainDamageType: `Основной источник: **${
        BossManager.DAMAGE_SOURCES[mainDamage.at(0)].label
      } ${((mainDamage.at(1) / boss.damageTaken) * 100).toFixed(1)}%**`,
      weakestDamageType: `Худший источник: ${
        BossManager.DAMAGE_SOURCES[weakestDamage.at(0)].label
      } — ${toFixedAfterZero((weakestDamage.at(1) / boss.damageTaken) * 100)}% (${weakestDamage.at(1)} ед.)`,
      attacksCount: `Совершено прямых атак: ${boss.stats.userAttacksCount}`,
      usersCount: `Приняло участие: ${ending(
        participants.length,
        "человек",
        "",
        "",
        "а",
      )}`,
      parting: boss.level > 3 ? "Босс остался доволен.." : "Босс недоволен..",
      rewards: `Пользователи получают ключи в количестве равном ${
        100 / BossEndPull.DAMAGE_FOR_KEY
      }% от нанесенного урона и некоторое количество нестабильности в зависимости от нанесенного урона`,
      mostStrongUser: `Сильнельший атакер: ${mostStrongUser.toString()}: ${NumberFormatLetterize(
        boss.users[mostStrongUser.id].damageDealt,
      )} ед., — он получает 3 нестабильности`,
      invisibleSpace: "⠀",
    };

    const footer = {
      text: `Пробыл здесь ${BossManager.BOSS_DURATION_IN_DAYS} дня и просто ушёл`,
      iconURL: guild.iconURL(),
    };

    const components = {
      type: ComponentType.Button,
      style: ButtonStyle.Secondary,
      label: "Событие с боссом завершилось",
      customId: "bye-bye",
      disabled: true,
    };

    const description = `🧩 ${contents.dice}\n${contents.bossLevel}\n\n${contents.damageDealt}.\n${contents.mainDamageType}\n${contents.weakestDamageType}\n${contents.attacksCount}\n\n🩸 ${contents.usersCount}. ${contents.parting}\n${contents.mostStrongUser}.\n${contents.rewards}.\n\n${contents.invisibleSpace}`;
    const embed = {
      title: "Среди ночи он покинул сервер",
      description,
      footer,
      components,
    };
    guild.chatSend(embed);
  }

  static async bossApparance(guild) {
    if (guild.members.me.joinedTimestamp > Date.now() + MONTH * 2) {
      return;
    }

    if (!guild.data.chatChannel || guild.data.disableBoss) {
      return;
    }

    const guildData = guild.data;

    if (
      !guildData.boss ||
      (!guildData.boss.isArrived && !guildData.boss.apparanceAtDay)
    ) {
      guildData.boss = {};
      guildData.boss.apparanceAtDay = this.comeUpApparanceDay();
    }

    if (guildData.boss.endingAtDay <= DataManager.data.bot.currentDay) {
      await BossManager.beforeEnd(guild);
      delete guildData.boss;
      return;
    }

    if (guildData.boss.apparanceAtDay <= DataManager.data.bot.currentDay) {
      BossManager.summonBoss(guild);
    }
  }

  static calculateBossDamageMultiplayer(
    boss,
    { context = {}, sourceUser = {} } = {},
  ) {
    let multiplayer = 1;
    multiplayer *= boss.diceDamageMultiplayer ?? 1;
    multiplayer *= boss.legendaryWearonDamageMultiplayer ?? 1;

    if (context.restoreHealthByDamage) {
      multiplayer *= -context.restoreHealthByDamage;
    }

    return multiplayer;
  }

  static calculateHealthPoint(level) {
    return 7_000 + Math.floor(level * 500 * 1.2 ** level);
  }

  static calculateHealthPointThresholder(level) {
    const totalOfPrevious = [...new Array(level - 1)]
      .map((_, level) => BossManager.calculateHealthPoint(level))
      .reduce((acc, points) => acc + points, 0);

    return BossManager.calculateHealthPoint(level) + totalOfPrevious;
  }

  static comeUpApparanceDay() {
    const now = new Date();
    const MIN = 1;
    const MAX = 28;
    const date = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      random(MIN, MAX),
    );
    return timestampDay(date.getTime());
  }

  static get eventBases() {
    return eventBases;
  }

  static fatalDamage(context) {
    const calculatePossibleLevels = (boss) => {
      let currentLevel = boss.level - 1;
      let healthThresholder;
      do {
        currentLevel++;
        healthThresholder =
          BossManager.calculateHealthPointThresholder(currentLevel);
      } while (boss.damageTaken >= healthThresholder);

      return currentLevel;
    };
    const { boss } = context;
    Object.assign(context, {
      possibleLevels: calculatePossibleLevels(boss),
      ...createDefaultPreventable(),
    });

    BossEvents.beforeDeath(boss, context);
    if (context.defaultPrevented()) {
      return;
    }

    BossManager.kill({
      ...context,
      fromLevel: boss.level,
      toLevel: context.possibleLevels,
    });
  }

  static generateEndDate(customDuration) {
    const duration = customDuration || this.BOSS_DURATION_IN_DAYS;
    const today = DataManager.data.bot.currentDay;
    return today + duration;
  }

  static getMediaAvatars() {
    return [
      "https://media.discordapp.net/attachments/629546680840093696/1047587012665933884/batman-gif.gif",
      "https://media.discordapp.net/attachments/629546680840093696/1051424759537225748/stan.png",
      "https://cdn.discordapp.com/attachments/629546680840093696/1062620914321211432/DeepTown.png",
    ];
  }

  static getUserStats(boss, id) {
    if (typeof id !== "string") {
      throw new TypeError("Expected id");
    }

    const bossUsers = boss.users;
    if (id in bossUsers === false) bossUsers[id] = { messages: 0 };

    return bossUsers[id];
  }

  static initBossData(boss, guild) {
    boss.level = 1;
    boss.users = {};
    boss.isArrived = true;
    boss.damageTaken = 0;
    boss.elementType = this.BOSS_TYPES.random().type;

    boss.stats = {
      damage: {},
      userAttacksCount: 0,
    };

    boss.guildId = guild.id;
    boss.healthThresholder = BossManager.calculateHealthPointThresholder(
      boss.level,
    );

    boss.avatarURL = this.getMediaAvatars().random();
    return boss;
  }

  static isArrivedIn(guild) {
    const boss = guild.data.boss;
    if (!boss) {
      return false;
    }

    return !!boss.isArrived;
  }

  static isDefeated(boss) {
    return boss.isDefeated;
  }

  static isElite(boss) {
    return boss.level >= 10;
  }
  static kill(context) {
    const { boss, sourceUser, fromLevel, toLevel } = context;
    const { LevelKill, sendReward } = RewardSystem;
    const { exp: expReward } = LevelKill.resources({
      fromLevel,
      toLevel,
    });

    if (sourceUser) {
      sendReward(
        {
          user: sourceUser,
          executor: sourceUser,
          source: "bossManager.kill",
          context,
        },
        { exp: expReward },
      );
    }

    BossEvents.onBossDeath(boss, { fromLevel, toLevel, sourceUser });

    const guild = app.client.guilds.cache.get(boss.guildId);

    boss.level = toLevel;
    update_health_thresholder(boss);

    if (boss.level >= this.MAXIMUM_LEVEL) {
      this.victory(guild);
    }

    const contents = {
      footerText: "Образ переходит в новую стадию",
      title: "Слишком просто! Следующий!",
      main: sourceUser
        ? `${sourceUser.username} наносит пронзающий удар и получает ${expReward} <:crys2:763767958559391795>`
        : "Пронзительный удар из ни откуда нанёс критический для босса урон",
      isImagine: toLevel - 1 !== fromLevel ? "<:tan:1068072988492189726>" : "",
      levels: `${fromLevel}...${toLevel}`,
    };
    const footer = {
      text: contents.footerText,
      iconURL: sourceUser ? sourceUser.avatarURL() : guild.iconURL(),
    };
    guild.chatSend({
      description: `${contents.title} (${contents.levels})\n${contents.main}\n${contents.isImagine}`,
      footer,
    });
    BossManager.BonusesChest.createCollector({
      guild,
      boss,
      fromLevel,
      toLevel,
    });
  }

  static makeDamage(
    boss,
    damage,
    { sourceUser, damageSourceType = BossManager.DAMAGE_SOURCES.other } = {},
  ) {
    const baseDamage = damage;
    damage *= this.calculateBossDamageMultiplayer(boss, {
      sourceUser,
      context: {
        restoreHealthByDamage: sourceUser.effects?.damageRestoreHealht ?? false,
      },
    });
    damage = Math.floor(damage);

    if (isNaN(damage)) {
      throw new TypeError("Damage not a Number");
    }

    const context = { boss, damage, damageSourceType, sourceUser, baseDamage };
    boss.damageTaken += damage;

    if (sourceUser) {
      const stats = BossManager.getUserStats(boss, sourceUser.id);
      stats.damageDealt ||= 0;
      stats.damageDealt += damage;

      sourceUser.action(ActionsMap.bossMakeDamage, context);
    }

    if (damageSourceType !== null) {
      const damageStats = boss.stats.damage;
      damageStats[damageSourceType] ??= 0;
      damageStats[damageSourceType] += damage;
    }

    BossEvents.onTakeDamage(boss, context);
    DataManager.data.bot.bossDamageToday += damage;

    if (boss.damageTaken >= boss.healthThresholder) {
      BossManager.fatalDamage(context);
    }

    return damage;
  }
  static onMessage(message) {
    const boss = message.guild.data.boss;
    const authorId = message.author.id;

    const userStats = this.getUserStats(boss, authorId);
    userStats.messages++;

    const DEFAULT_DAMAGE = 1;
    const damage = userStats.damagePerMessage ?? DEFAULT_DAMAGE;
    const damageSourceType = BossManager.DAMAGE_SOURCES.message;
    BossManager.makeDamage(boss, damage, {
      sourceUser: message.author,
      damageSourceType,
    });
  }
  static summonBoss(guild) {
    const boss = (guild.data.boss ||= {});
    boss.endingAtDay = this.generateEndDate();
    delete boss.apparanceAtDay;

    BossManager.initBossData(boss, guild);
    return boss;
  }
  static async userAttack(primary) {
    const { boss, user, channel } = primary;
    const userStats = BossManager.getUserStats(boss, user.id);

    if (userStats.heroIsDead) {
      channel.msg({
        description: "Недоступно до воскрешения",
        color: "#ff0000",
        footer: { text: user.username, iconURL: user.avatarURL() },
        delete: 30_000,
      });
      return;
    }

    if (boss.isDefeated) {
      channel.msg({
        description: "Прямые атаки недоступны после победы над боссом",
        color: "#ff0000",
        footer: { text: user.username, iconURL: user.avatarURL() },
        delete: 30_000,
      });
      return;
    }

    userStats.attack_CD ||= 0;
    userStats.attackCooldown ||= this.USER_DEFAULT_ATTACK_COOLDOWN;

    const footer = { iconURL: user.avatarURL(), text: user.tag };
    if (userStats.attack_CD > Date.now()) {
      const description = `**${timestampToDate(
        userStats.attack_CD - Date.now(),
      )}**. Дождитесь подготовки перед атакой.`;
      channel.msg({
        title: "⚔️ Перезарядка..!",
        color: "#ff0000",
        description,
        delete: 7000,
        footer,
      });
      return;
    }

    update_attack_cooldown(
      user,
      boss,
      "",
      primary,
      0,
      userStats.attackCooldown,
    );

    const context = core_make_attack_context(boss, user, channel, primary);
    const { attackContext } = context;

    if (!process_before_attack(context)) {
      return;
    }

    const pull = resolve_attack_events_pull(context);
    for (let i = 0; i < attackContext.eventsCount; i++) {
      const base = pull.random({ weights: true });

      if (!base) {
        continue;
      }
      if (!base.repeats) {
        pull.remove(base);
      }
      attack_event_callback(base, context);
      attackContext.listOfEvents.push(base);
    }

    core_make_attack(context);
    context.message = await display_attack(context);
  }
  static victory(guild) {
    const boss = guild.data.boss;
    if (boss.isDefeated) {
      return;
    }

    guild.chatSend({
      description:
        "Вы сильные. Спасибо Вам за то, что вы рядом.\nБосс побеждён и прямые атаки по нему больше не проходят. Вы можете использовать реликвии и другие способы нанесения урона, чтобы продвинуться в топ'е",
    });
    boss.isDefeated = true;
  }
}

export {
  AttributesShop,
  BossEffects,
  BossEvents,
  BossManager,
  Relics as BossRelics,
  Speacial as BossSpecial,
};
export default BossManager;
