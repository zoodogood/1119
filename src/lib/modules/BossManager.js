import { Collection } from "@discordjs/collection";
import {
  DataManager,
  CurseManager,
  Properties,
  ErrorsHandler,
} from "#lib/modules/mod.js";
import { Elements, elementsEnum } from "#folder/commands/thing.js";
import { Actions } from "#lib/modules/ActionManager.js";
import * as Util from "#lib/util.js";
import { ButtonStyle, ComponentType } from "discord.js";
import app from "#app";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import {
  EffectInfluenceEnum,
  UserEffectManager,
} from "#lib/modules/EffectsManager.js";
import { MONTH } from "#constants/globals/time.js";

class Speacial {
  static AVATAR_OF_SNOW_QUEEN =
    "https://media.discordapp.net/attachments/926144032785195059/1189474240974565436/b9183b53bdf18835d4c337f06761d95d_1400x790-q-85_1_1.webp?ex=659e4b36&is=658bd636&hm=0889765cc144e316843ab5ad88144db1ae96f9c21f4747f303860d647200cf00&=&format=webp";

  static isSnowQueen(boss) {
    return boss.avatarURL === Speacial.AVATAR_OF_SNOW_QUEEN;
  }
}

class BossUtils {
  static damageTypeLabel(value) {
    const numeric =
      typeof value === "string" ? BossManager.DAMAGE_SOURCES[value] : value;
    return BossManager.DAMAGE_SOURCES[numeric].label;
  }
}

class BossShop {
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
            `${label}\n${price} ${Properties.endingOf(
              product.resource,
              price,
            )};`,
        )
        .join("\n");

      const descriptionContent = `Приобретите эти товары! Ваши экономические возможности:\n${Util.ending(
        data.coins,
        "монет",
        "",
        "а",
        "ы",
      )} <:coin:637533074879414272> и ${Util.ending(
        data.keys,
        "ключ",
        "ей",
        "",
        "а",
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

  static isUserCanBuyProduct({ user, product, userStats }) {
    return (
      user.data[product.resource] >=
      this.calculatePrice({
        product,
        boughtCount: this.getBoughtCount({ userStats, product }),
      })
    );
  }

  static getBoughtCount({ userStats, product }) {
    const boughtMap = userStats.bought ?? {};
    return boughtMap[product.keyword] || 0;
  }

  static calculatePrice({ product, boughtCount }) {
    const grossPrice =
      product.basePrice * product.priceMultiplayer ** (boughtCount ?? 0);
    const price =
      grossPrice > 30 ? Math.floor(grossPrice - (grossPrice % 5)) : grossPrice;
    return price;
  }

  static PRODUCTS = new Collection(
    Object.entries({
      "🧩": {
        emoji: "🧩",
        keyword: "puzzle",
        description: "Множитель атаки: 1.25",
        basePrice: 100,
        priceMultiplayer: 2,
        resource: "coins",
        callback: ({ userStats }) => {
          const multiplier = 1.25;
          userStats.attacksDamageMultiplayer = +(
            (userStats.attacksDamageMultiplayer ?? 1) * multiplier
          ).toFixed(3);
        },
      },
      "🐺": {
        emoji: "🐺",
        keyword: "wolf",
        description: "Перезарядка атаки в 2 раза меньше",
        basePrice: 50,
        priceMultiplayer: 1.75,
        resource: "coins",
        callback: ({ userStats }) => {
          userStats.attackCooldown ||= BossManager.USER_DEFAULT_ATTACK_COOLDOWN;
          userStats.attackCooldown = Math.floor(userStats.attackCooldown / 2);

          userStats.attack_CD -= userStats.attackCooldown;
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
}

class BossEvents {
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

  static beforeAttacked(boss, context) {}

  static afterAttacked(boss, context) {}

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
            time: Util.timestampToDate(
              now -
                (boss.endingAtDay - BossManager.BOSS_DURATION_IN_DAYS) *
                  86_400_000,
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
          sourceUser.action(Actions.globalQuest, { name: "firstTimeKillBoss" });
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

          sourceUser.action(Actions.globalQuest, { name: "killBossAlone" });
        },
      },
    }),
  );
}

class BossEffects {
  static updateBasesFromManager() {
    this.effectBases = new Collection(
      UserEffectManager.store
        .filter((value) => value.id.startsWith("boss."))
        .entries(),
    );
  }

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
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
    };
    user.action(Actions.bossBeforeEffectInit, context);
    if (context.defaultPrevented) {
      return context;
    }

    context.applyContext = UserEffectManager.applyEffect({
      effect,
      effectBase,
      user,
      context,
    });
    if (context.applyContext.defaultPrevented) {
      context.defaultPrevented = true;
      return context;
    }
    user.action(Actions.bossEffectInit, context);
    return context;
  }

  static removeEffects({ list, user }) {
    for (const effect of list) {
      this._removeEffect({ effect, user });
    }
  }

  static cleanCallbackMap(user) {
    UserEffectManager.cleanCallbackMap(user);
  }

  static removeEffect({ effect, user }) {
    this.removeEffects({ list: [effect], user });
  }

  static _removeEffect({ effect, user }) {
    const index = UserEffectManager.indexOf({ effect, user });
    if (index === -1) {
      return null;
    }

    user.action(Actions.bossEffectEnd, { effect, index });
    UserEffectManager.removeEffect({ effect, user });
  }

  static effectsOf({ boss, user }) {
    return UserEffectManager.effectsOf({ user }).filter(
      (effect) =>
        effect.id.startsWith("boss.") && effect.values.guildId === boss.guildId,
    );
  }

  /**
   * @type {Collection<string, import("#lib/modules/EffectsManager.js").BaseEffect>}
   */
  static effectBases;
}

class BossRelics {
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

  static isUserHasRelic({ relic, userData }) {
    return !!userData.bossRelics?.includes(relic.id);
  }

  static calculatePriceForRelic({ boss, user }) {
    const userStats = BossManager.getUserStats(boss, user.id);
    const relicsBought = userStats.boughedRelics?.length;
    const price = Math.round(350 - 349 * (1 / 1.0135) ** relicsBought);
    return price;
  }
}

const LegendaryWearonList = new Collection(
  Object.entries({
    afkPower: {
      description: "Урон ваших атак будет расти за время простоя",
      effect: "boss.increaseDamageByAfkTime",
      emoji: "❄️",
      values: {
        power: () => 1 / (60_000 * 10),
      },
    },
    percentDamage: {
      description: "Базовый урон атак равен 0.05% от текущего здоровья босса",
      effect: "boss.increaseDamageByBossCurrentHealthPoints",
      emoji: "🩸",
      values: {
        power: () => 0.0005,
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

class BossManager {
  static MAIN_COLOR = "";
  static ELITE_MAIN_COLOR = "";
  static BOSS_DURATION_IN_DAYS = 3;
  static MAXIMUM_LEVEL = 100;

  static summonBoss(guild) {
    const boss = (guild.data.boss ||= {});
    boss.endingAtDay = this.generateEndDate();
    delete boss.apparanceAtDay;

    BossManager.initBossData(boss, guild);
    return boss;
  }

  static async bossApparance(guild) {
    if (guild.members.me.joinedTimestamp > Date.now() + MONTH * 2) {
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

  static comeUpApparanceDay() {
    const now = new Date();
    const MIN = 1;
    const MAX = 28;
    const date = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      Util.random(MIN, MAX),
    );
    return Util.timestampDay(date.getTime());
  }

  static generateEndDate(customDuration) {
    const duration = customDuration || this.BOSS_DURATION_IN_DAYS;
    const today = DataManager.data.bot.currentDay;
    return today + duration;
  }

  static isArrivedIn(guild) {
    const boss = guild.data.boss;
    if (!boss) {
      return false;
    }

    return !!boss.isArrived;
  }

  static isElite(boss) {
    return boss.level >= 10;
  }

  static isDefeated(boss) {
    return boss.isDefeated;
  }

  static getUserStats(boss, id) {
    if (typeof id !== "string") {
      throw new TypeError("Expected id");
    }

    const bossUsers = boss.users;
    if (id in bossUsers === false) bossUsers[id] = { messages: 0 };

    return bossUsers[id];
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

  static calculateHealthPoint(level) {
    return 7_000 + Math.floor(level * 500 * 1.2 ** level);
  }

  static calculateHealthPointThresholder(level) {
    const totalOfPrevious = [...new Array(level - 1)]
      .map((_, level) => BossManager.calculateHealthPoint(level))
      .reduce((acc, points) => acc + points, 0);

    return BossManager.calculateHealthPoint(level) + totalOfPrevious;
  }

  static calculateBossDamageMultiplayer(
    boss,
    { context = {}, sourceUser = {} } = {},
  ) {
    let multiplier = 1;
    multiplier *= boss.diceDamageMultiplayer ?? 1;
    multiplier *= boss.legendaryWearonDamageMultiplayer ?? 1;

    if (context.restoreHealthByDamage) {
      multiplier *= -context.restoreHealthByDamage;
    }

    return multiplier;
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

      sourceUser.action(Actions.bossMakeDamage, context);
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
      preventDefault() {
        this.defaultPrevented = true;
      },
      defaultPrevented: false,
    });

    BossEvents.beforeDeath(boss, context);
    if (context.defaultPrevented) {
      return;
    }

    BossManager.kill({
      ...context,
      fromLevel: boss.level,
      toLevel: context.possibleLevels,
    });
  }

  static calculateKillReward({ fromLevel, toLevel }) {
    const ADDING_PER_LEVEL = 25;
    const perLevel = 100 + (toLevel + fromLevel + 1) * (ADDING_PER_LEVEL / 2);
    return perLevel * (toLevel - fromLevel);
  }

  static kill(context) {
    const { boss, sourceUser, fromLevel, toLevel } = context;
    const expReward = this.calculateKillReward({ fromLevel, toLevel });

    if (sourceUser) {
      sourceUser.data.exp += expReward;
    }

    BossEvents.onBossDeath(boss, { fromLevel, toLevel, sourceUser });

    const guild = app.client.guilds.cache.get(boss.guildId);

    boss.level = toLevel;
    boss.healthThresholder =
      BossManager.calculateHealthPointThresholder(toLevel);

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

  static BonusesChest = {
    BASE_BONUSES: 50,
    BONUSES_PER_LEVEL: 10,
    RECEIVE_LIMIT: 20,
    BONUS_VOID_PULL: 3,
    DAMAGE_FOR_VOID: 150_000,
    GUARANTEE_DAMAGE_PART_FOR_VOID: 0.2,
    VOID_REWARD_DENOMINATOR: 0.8,
    VOID_LIMIT_MULTIPLAYER: 3,
    DAMAGE_FOR_KEY: 5_000,
    KEYS_LIMIT: 10_000,
    MAIN_COLOR: "#ffda73",

    createRewardPull: ({ userStats, level, bonuses = true }) => {
      const BossChest = BossManager.BonusesChest;

      // chestBonus
      const bonusesReward =
        BossChest.BASE_BONUSES + level * BossChest.BONUSES_PER_LEVEL;

      // void
      const numerator =
        Math.random() * userStats.damageDealt +
        userStats.damageDealt * BossChest.GUARANTEE_DAMAGE_PART_FOR_VOID;

      const byDamage =
        (numerator / BossChest.DAMAGE_FOR_VOID) **
        BossChest.VOID_REWARD_DENOMINATOR;

      const voidByRandom = Number(Util.random(BossChest.BONUS_VOID_PULL) === 1);

      const voidLimit = level * BossChest.VOID_LIMIT_MULTIPLAYER;

      const voidReward = Math.min(
        voidLimit,
        Math.floor(byDamage + voidByRandom),
      );

      // keys
      const keysReward = Math.min(
        BossChest.KEYS_LIMIT,
        Math.floor(userStats.damageDealt / BossChest.DAMAGE_FOR_KEY),
      );

      const rewards = {
        chestBonus: bonuses ? bonusesReward : 0,
        void: voidReward,
        keys: keysReward,
      };
      return rewards;
    },
    createEmbed: ({ fromLevel, toLevel, taking }) => {
      const levelsDiff = toLevel - fromLevel;
      const contents = {
        rewardPer: `Получите бонусы за победу над боссом ур. ${toLevel}`,
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
        time: 3_600_000 * 2,
      });
      collector.on("collect", (_reaction, user) => {
        const result = BossChest.onCollect(user, context);
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
    onCollect: (user, context) => {
      const { toLevel, message, guild } = context;
      const boss = guild.data.boss;
      const userStats = BossManager.getUserStats(boss, user.id);

      if ("chestRewardAt" in userStats) {
        message.msg({
          title: `Вы уже взяли награду на ур. ${userStats.chestRewardAt}`,
          delete: 5000,
        });
        return;
      }

      const rewardPull = BossManager.BonusesChest.createRewardPull({
        level: toLevel,
        userStats,
        bonuses: true,
      });
      for (const [resource, value] of Object.entries(rewardPull)) {
        user.action(Actions.resourceChange, {
          value,
          executor: user,
          source: "bossManager.chest.onCollect",
          resource,
          context,
        });
      }

      userStats.chestRewardAt = toLevel;
      BossManager.BonusesChest.sendReward(user, rewardPull);
      message.msg({
        description: `Получено ${Util.ending(
          rewardPull.chestBonus,
          "бонус",
          "ов",
          "",
          "а",
        )} для сундука <a:chest:805405279326961684>, ${rewardPull.keys} 🔩 и ${
          rewardPull.void
        } <a:void:768047066890895360>`,
        color: BossManager.BonusesChest.MAIN_COLOR,
        delete: 7000,
      });

      return true;
    },
    sendReward(user, rewardPull) {
      const userData = user.data;
      Object.entries(rewardPull).forEach(
        ([key, count]) => (userData[key] = (userData[key] ?? 0) + (count || 0)),
      );
    },
  };

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

    await Util.sleep(3000);

    const descriptionImage = `Настоящий босс — это здравый смысл внутри каждого из нас. И всем нам предстоит с ним сразится.`;
    const descriptionFacts = `<a:bigBlack:829059156069056544> С завтрашенего дня, в течении трёх дней, босс будет проходить по землям сервера в определенном образе. За это время нанесите как можно больше урона.\nПосле его появления на сервере будет доступна команда **!босс**, а по завершении участники получат небольшую награду`;
    const description = `${descriptionImage}\n\n${descriptionFacts}`;

    const embed = {
      color: "#210052",
      description,
    };

    await guild.chatSend(embed);
  }

  static rewardToBank(guild) {
    const REWARD_PER_LEVEL = 1_000;
    const guildData = guild.data;
    guildData.coins ||= 0;
    const { boss } = guildData;
    guildData.coins += boss.level * REWARD_PER_LEVEL;
  }

  static async beforeEnd(guild) {
    const boss = guild.data.boss;
    const usersCache = guild.client.users.cache;

    if (boss.level > 1 === false) {
      guild.chatSend({ content: "Босс покинул сервер в страхе..." });
      return;
    }
    const DAMAGE_THRESHOLDER_FOR_REWARD = 1_500;
    const createRewardPull = BossManager.BonusesChest.createRewardPull;

    const sendReward = ([id, userStats]) => {
      const user = usersCache.get(id);
      const rewardPull = createRewardPull({
        bonuses: false,
        userStats,
        level: boss.level,
      });
      rewardPull.void = (rewardPull.void || 0) + 1;

      for (const [resource, value] of Object.entries(rewardPull)) {
        user.action(Actions.resourceChange, {
          value,
          executor: null,
          source: "bossManager.beforeEnd.sendReward",
          resource,
          context: { boss, rewardPull },
        });
      }
      BossManager.BonusesChest.sendReward(user, rewardPull);
    };

    const cleanEffects = (user) => {
      const list = BossEffects.effectsOf({ user, boss });
      BossEffects.removeEffects({ list, user });
    };

    const usersStatsEntries = Object.entries(boss.users);
    this.rewardToBank(guild);

    usersStatsEntries
      .filter(
        ([_id, { damageDealt }]) => damageDealt > DAMAGE_THRESHOLDER_FOR_REWARD,
      )
      .forEach(sendReward);

    usersStatsEntries.map(([id]) => usersCache.get(id)).forEach(cleanEffects);

    const mainDamage = Object.entries(boss.stats.damage).reduce(
      (acc, current) => (acc.at(1) > current.at(1) ? acc : current),
      [BossManager.DAMAGE_SOURCES.other, 0],
    );

    const weakestDamage = Object.entries(boss.stats.damage).reduce(
      (acc, current) => (acc.at(1) < current.at(1) ? acc : current),
      [BossManager.DAMAGE_SOURCES.other, Number.MAX_SAFE_INTEGER],
    );

    const participants = Object.entries(boss.users).filter(
      ([id, { damageDealt }]) => damageDealt,
    );

    const contents = {
      dice: `Максимальный множитель урона от эффектов: Х${this.calculateBossDamageMultiplayer(
        boss,
      ).toFixed(2)};`,
      bossLevel: `Достигнутый уровень: ${
        boss.level
      } (${this.calculateKillReward({
        fromLevel: 1,
        toLevel: boss.level,
      })} опыта)`,
      damageDealt: `Совместными усилиями участники сервера нанесли **${Util.NumberFormatLetterize(
        boss.damageTaken,
      )}** ед. урона`,
      mainDamageType: `Основной источник: **${
        BossManager.DAMAGE_SOURCES[mainDamage.at(0)].label
      } ${((mainDamage.at(1) / boss.damageTaken) * 100).toFixed(1)}%**`,
      weakestDamageType: `Худший источник: ${
        BossManager.DAMAGE_SOURCES[weakestDamage.at(0)].label
      } — ${((weakestDamage.at(1) / boss.damageTaken) * 100).toFixed(
        2,
      )}% (${weakestDamage.at(1)} ед.)`,
      attacksCount: `Совершено прямых атак: ${boss.stats.userAttacksCount}`,
      usersCount: `Приняло участие: ${Util.ending(
        participants.length,
        "человек",
        "",
        "",
        "а",
      )}`,
      parting: boss.level > 3 ? "Босс остался доволен.." : "Босс недоволен..",
      rewards: `Пользователи получают ключи в количестве равном ${
        100 / BossManager.BonusesChest.DAMAGE_FOR_KEY
      }% от нанесенного урона и примерно случайное количество нестабильности в зависимости от нанесенного урона`,
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

    const description = `🧩 ${contents.dice}\n${contents.bossLevel}\n\n${contents.damageDealt}.\n${contents.mainDamageType}\n${contents.weakestDamageType}\n${contents.attacksCount}\n\n🩸 ${contents.usersCount}. ${contents.parting}\n${contents.rewards}.\n\n${contents.invisibleSpace}`;
    const embed = {
      title: "Среди ночи он покинул сервер",
      description,
      footer,
      components,
    };
    guild.chatSend(embed);
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

  static getMediaAvatars() {
    return [
      "https://media.discordapp.net/attachments/629546680840093696/1047587012665933884/batman-gif.gif",
      "https://media.discordapp.net/attachments/629546680840093696/1051424759537225748/stan.png",
      "https://cdn.discordapp.com/attachments/629546680840093696/1062620914321211432/DeepTown.png",
    ];
  }

  static async userAttack({ boss, user, channel }) {
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

    userStats.attack_CD ||= 0;
    userStats.attackCooldown ||= this.USER_DEFAULT_ATTACK_COOLDOWN;

    const footer = { iconURL: user.avatarURL(), text: user.tag };
    if (userStats.attack_CD > Date.now()) {
      const description = `**${Util.timestampToDate(
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

    userStats.attack_CD = Date.now() + userStats.attackCooldown;

    const attackContext = {
      damageMultiplayer: 1,
      listOfEvents: [],
      defaultDamage: this.USER_DEFAULT_ATTACK_DAMAGE,
      eventsCount: Math.floor(boss.level ** 0.5) + Util.random(-1, 1),
      message: null,
    };

    const data = {
      user,
      userStats,
      boss,
      channel,
      attackContext,
      guild: channel.guild,
      preventDefault() {
        this.defaultPrevented = true;
      },
      message: null,
      fetchMessage() {
        return this.message;
      },
    };

    user.action(Actions.bossBeforeAttack, data);
    BossEvents.beforeAttacked(boss, data);

    if (data.defaultPrevented) {
      return;
    }

    const pull = [...BossManager.eventBases.values()]
      .filter((event) => !event.filter || event.filter(data))
      .map((event) => ({
        ...event,
        _weight:
          typeof event.weight === "function"
            ? event.weight(data)
            : event.weight,
      }));

    for (let i = 0; i < attackContext.eventsCount; i++) {
      const event = pull.random({ weights: true });

      if (!event) {
        continue;
      }
      if (!event.repeats) {
        const index = pull.indexOf(event);
        ~index && pull.splice(index, 1);
      }

      try {
        event.callback.call(event, data);
      } catch (error) {
        ErrorsHandler.onErrorReceive(error, { source: "BossAttackAction" });
        channel.msg({
          title: `Источник исключения: ${event.id}. Он был убран из списка возможных событий на неопределенный срок`,
          description: `**${error.message}:**\n${error.stack}`,
        });
        BossManager.eventBases.delete(event.id);
      }
      attackContext.listOfEvents.push(event);
    }

    const damage = Math.ceil(
      (userStats.attacksDamageMultiplayer ?? 1) *
        attackContext.defaultDamage *
        attackContext.damageMultiplayer,
    );
    attackContext.defaultDamage = attackContext.damageDealt = damage;

    const damageSourceType = BossManager.DAMAGE_SOURCES.attack;
    const dealt = BossManager.makeDamage(boss, damage, {
      sourceUser: user,
      damageSourceType,
    });

    user.action(Actions.bossAfterAttack, data);
    BossEvents.afterAttacked(boss, data);

    boss.stats.userAttacksCount++;
    userStats.attacksCount = (userStats.attacksCount || 0) + 1;

    const eventsContent = attackContext.listOfEvents
      .map((event) => `・ ${event.description}.`)
      .join("\n");
    const description = `Нанесено урона с прямой атаки: ${Util.NumberFormatLetterize(
      dealt,
    )} ед.\n\n${eventsContent}`;
    (() => {
      const emoji = "⚔️";
      const embed = {
        title: `${emoji} За сервер ${channel.guild.name}!`,
        description,
        footer,
      };
      data.message = channel.msg(embed);
    })();
  }

  static eventBases = new Collection(
    Object.entries({
      increaseAttackCooldown: {
        weight: 1500,
        id: "increaseAttackCooldown",
        description: "Перезарядка атаки больше на 20 минут",
        callback: ({ userStats }) => {
          userStats.attackCooldown ||= this.USER_DEFAULT_ATTACK_COOLDOWN;
          const adding = 60_000 * 20;
          userStats.attackCooldown += adding;
          userStats.attack_CD += adding;
        },
        filter: ({ attackContext }) =>
          !attackContext.listOfEvents.some(({ id }) =>
            ["reduceAttackDamage"].includes(id),
          ),
      },
      increaseCurrentAttackDamage: {
        weight: 4500,
        repeats: true,
        id: "increaseAttackCooldown",
        description: "Урон текущей атаки был увеличен",
        callback: ({ attackContext }) => {
          attackContext.damageMultiplayer *= 5;
        },
      },
      increaseNextTwoAttacksDamage: {
        weight: 1_000,
        repeats: true,
        id: "increaseAttackCooldown",
        description: "Урон следующих двух атак был увеличен",
        callback: ({ guild, user }) => {
          const effectId = "boss.increaseAttackDamage";
          const values = { duration: 2, power: 3 };
          BossEffects.applyEffect({ values, guild, user, effectId });
        },
      },
      giveChestBonus: {
        weight: 1200,
        id: "giveChestBonus",
        description: "Выбито 4 бонуса сундука",
        callback: ({ user }) => {
          user.data.chestBonus = (user.data.chestBonus ?? 0) + 4;
        },
      },
      applyCurse: {
        weight: 900,
        id: "applyCurse",
        description: "Вас прокляли",
        callback: ({ user, boss, channel }) => {
          const hard = Math.min(Math.floor(boss.level / 5), 2);
          const curse = CurseManager.generate({
            user,
            hard,
            context: { guild: channel.guild },
          });
          CurseManager.init({ user, curse });
        },
        filter: ({ user }) =>
          !user.data.curses?.length || user.data.voidFreedomCurse,
      },
      improveDamageForAll: {
        weight: 300,
        id: "improveDamageForAll",
        description: "Кубик — урон по боссу увеличен на 1%",
        callback: ({ user, boss }) => {
          boss.diceDamageMultiplayer ||= 1;
          boss.diceDamageMultiplayer += 0.01;
        },
        filter: ({ boss }) => boss.diceDamageMultiplayer,
      },
      superMegaAttack: {
        weight: 200,
        id: "superMegaAttack",
        description: "Супер мега атака",
        callback: async (parentContext) => {
          const { user, boss, channel, userStats } = parentContext;
          const ActionsEnum = {
            Hit: "hit",
            Leave: "leave",
          };

          channel.sendTyping();
          await Util.sleep(2000);
          const executorMessage = await parentContext.fetchMessage();

          const embed = {
            title: "**~ СУПЕР МЕГА АТАКА**",
            description: "Требуется совершить выбор :no_pedestrians:",
            footer: {
              iconURL: user.avatarURL(),
              text: "Вы можете проигнорировать это сообщение",
            },
            components: {
              label: "Нанести",
              type: ComponentType.Button,
              style: ButtonStyle.Secondary,
              customId: ActionsEnum.Hit,
            },
            color: Elements.at(boss.elementType).color,
            reference: executorMessage.id,
          };

          /**
           * @type import("discord.js").Message
           */
          const message = await channel.msg(embed);

          delete embed.reference;

          const collectorFilter = (interaction) => user === interaction.user;
          const interaction = await message
            .awaitMessageComponent({
              filter: collectorFilter,
              time: 60_000,
            })
            .catch(() => {});

          if (!interaction) {
            embed.components = [];
            message.msg({
              ...embed,
              edit: true,
            });
            return;
          }

          const BASE_DAMAGE = 1500;
          const DAMAGE_PER_LEVEL = 100;
          const damage = boss.level * DAMAGE_PER_LEVEL + BASE_DAMAGE;

          const dealt = BossManager.makeDamage(boss, damage, {
            sourceUser: user,
          });
          (() => {
            userStats.attackCooldown ||= this.USER_DEFAULT_ATTACK_COOLDOWN;
            const adding = 60_000 * 30;
            userStats.attackCooldown += adding;
            userStats.attack_CD += adding;
          })();

          embed.description = `Нанесено ${dealt} ед. урона.`;

          (async () => {
            embed.components = [
              {
                label: "Уйти",
                type: ComponentType.Button,
                style: ButtonStyle.Secondary,
                customId: ActionsEnum.Leave,
              },
              {
                label: "Нанести",
                type: ComponentType.Button,
                style: ButtonStyle.Secondary,
                customId: ActionsEnum.Hit,
              },
            ];
            let counter = 0;
            interaction.msg({ ...embed, edit: true });

            const collector = message.createMessageComponentCollector({
              filter: collectorFilter,
            });
            collector.on("collect", (interaction) => {
              const { customId } = interaction;
              if (customId !== ActionsEnum.Hit) {
                collector.stop();
                return;
              }

              const { adding } = (() => {
                userStats.attackCooldown ||= this.USER_DEFAULT_ATTACK_COOLDOWN;
                const adding = 60_000 * 7.5;
                userStats.attackCooldown += adding;
                userStats.attack_CD += adding;
                return { adding };
              })();

              if (Util.random(20) === 0) {
                embed.description += `\n~ Перезарядка увеличена ещё на ${Util.timestampToDate(
                  adding,
                )}`;
                collector.stop();
                return;
              }

              const BASE_DAMAGE = 120;
              const DAMAGE_PER_ITERATION = 90;
              const ADDING_DAMAGE = Math.round((Math.random() / 2 + 0.5) * 10);
              const DAMAGE_PER_LEVEL = 20;
              const damage =
                boss.level * DAMAGE_PER_LEVEL +
                BASE_DAMAGE +
                ADDING_DAMAGE +
                DAMAGE_PER_ITERATION * counter;

              const dealt = BossManager.makeDamage(boss, damage, {
                sourceUser: user,
              });
              embed.description += `\n~ Нанесено ещё ${dealt} ед. урона`;

              counter++;
              if (counter >= 5) {
                collector.stop();
                return;
              }

              interaction.msg({ ...embed, edit: true });
            });

            collector.on("end", () => {
              embed.description += " :drop_of_blood:";
              embed.components = [];
              interaction.msg({
                ...embed,
                edit: true,
              });
            });
          })();
        },
      },
      choiseAttackDefense: {
        weight: 700,
        id: "choiseAttackDefense",
        description: "Требуется совершить выбор",
        callback: async ({ user, boss, channel, userStats }) => {
          const reactions = ["⚔️", "🛡️"];
          const embed = {
            author: { name: user.username, iconURL: user.avatarURL() },
            description:
              "Вас атакуют!\n— Пытаться контратаковать\n— Защитная поза",
            reactions,
            footer: {
              iconURL: user.avatarURL(),
              text: "Вы можете проигнорировать это сообщение",
            },
          };

          channel.sendTyping();
          await Util.sleep(2000);

          const message = await channel.msg(embed);
          const filter = ({ emoji }, member) =>
            user === member && reactions.includes(emoji.name);
          const collector = message.createReactionCollector({
            filter,
            time: 30_000,
            max: 1,
          });
          collector.on("collect", (reaction) => {
            const isLucky = Util.random(0, 1);
            const emoji = reaction.emoji.name;

            if (!isLucky) {
              userStats.attack_CD += 60_000 * 20;
            }

            if (emoji === "⚔️" && isLucky) {
              const BASE_DAMAGE = 125;
              const DAMAGE_PER_LEVEL = 15;
              const damage = BASE_DAMAGE + DAMAGE_PER_LEVEL * boss.level;

              const dealt = BossManager.makeDamage(boss, damage, {
                sourceUser: user,
              });
              const content = `Успех! Нанесено ${dealt}ед. урона`;
              message.msg({ description: content });
              return;
            }

            if (emoji === "⚔️" && !isLucky) {
              const content =
                "После неудачной контратаки ваше оружие ушло на дополнительную перезарядку";
              message.msg({ description: content });
              return;
            }

            if (emoji === "🛡️" && isLucky) {
              const BASE_COINS = 1000;
              const COINS_PER_LEVEL = 100;
              const coins = BASE_COINS + COINS_PER_LEVEL * boss.level;

              const content = `Успех! Получено ${coins}ед. золота`;
              message.msg({ description: content });
              user.data.coins += coins;
              return;
            }

            if (emoji === "🛡️" && !isLucky) {
              const content =
                "После неудачной защиты ваше оружие ушло на дополнительную перезарядку";
              message.msg({ description: content });
              return;
            }
          });

          collector.on("end", () => message.delete());
        },
      },
      selectLegendaryWearon: {
        weight: ({ userStats }) => (userStats.attacksCount || 0) * 10,
        id: "selectLegendaryWearon",
        description: "Требуется совершить выбор",
        callback: async (context) => {
          const { user, channel, userStats, guild } = context;
          const reactions = [...LegendaryWearonList.values()].map(
            ({ emoji }) => emoji,
          );
          const getLabel = ({ description, emoji }) =>
            `${emoji} ${description}.`;
          const embed = {
            description: `**Выберите инструмент с привлекательным для Вас эпическим эффектом:**\n${LegendaryWearonList.map(
              getLabel,
            ).join("\n")}`,
            color: "#3d17a0",
            reactions,
            footer: {
              iconURL: user.avatarURL(),
              text: "Это событие появляется единожды",
            },
          };

          channel.sendTyping();
          await Util.sleep(2000);

          const message = await channel.msg(embed);
          const filter = ({ emoji }, member) =>
            user === member && reactions.includes(emoji.name);
          const collector = message.createReactionCollector({
            filter,
            time: 300_000,
            max: 1,
          });
          collector.on("collect", async (reaction) => {
            const emoji = reaction.emoji.name;
            const wearon = LegendaryWearonList.find(
              (wearon) => wearon.emoji === emoji,
            );
            if (!wearon) {
              throw new Error("Unexpected Exception");
            }

            const values = Object.fromEntries(
              Object.entries(wearon.values).map((key, value) => [
                key,
                value(context),
              ]),
            );
            BossEffects.applyEffect({
              guild,
              user,
              effectId: wearon.effect,
              values,
            });
            userStats.haveLegendaryWearon = true;

            message.channel.msg({
              color: "#000000",
              description: `Выбрано: ${wearon.description}`,
              reference: message.id,
            });
            await Util.sleep(10_000);
            collector.stop();
          });

          collector.on("end", () => message.reactions.removeAll());
        },

        filter: ({ userStats, boss }) =>
          !userStats.haveLegendaryWearon && boss.level >= 5,
      },
      choiseCreatePotion: {
        weight: 300,
        id: "choiseCreatePotion",
        description: "Требуется совершить выбор",
        callback: async ({ user, boss, channel, userStats, attackContext }) => {
          const reactions = ["🧪", "🍯", "🩸"];
          const embed = {
            author: { name: user.username, iconURL: user.avatarURL() },
            description:
              "Сварите правильный эликсир\n— 🧪 Добавить больше порошка\n— 🍯 Подсыпать пудры\n— 🩸 Средство для усиления эффекта",
            reactions,
            footer: {
              iconURL: user.avatarURL(),
              text: "Используйте три реакции для наилучшего эффекта",
            },
          };

          channel.sendTyping();
          await Util.sleep(2000);

          const ingredients = [];

          const createSpell = (ingredients) => {
            const spellsTable = {
              "🧪🧪🧪": {
                description:
                  "Создаёт особый котёл, который уменьшает перезарядку атаки каждого, кто использует его. Однако его длительность ограничена одним часом или пятью использованиями!",
                callback: async (message, _embed) => {
                  await message.react("🧪");
                  const collector = message.createReactionCollector({
                    time: 3_600_000,
                  });
                  const gotTable = {};
                  collector.on("collect", (_reaction, user) => {
                    if (user.id in gotTable) {
                      message.msg({
                        title: "Вы уже воспользовались котлом",
                        color: "#ff0000",
                        delete: 3000,
                      });
                      return;
                    }

                    if (Object.keys(gotTable).length >= 5) {
                      collector.stop();
                    }

                    gotTable[user.id] = true;
                    const userStats = BossManager.getUserStats(boss, user.id);
                    const current = userStats.attackCooldown;
                    userStats.attackCooldown = Math.floor(
                      userStats.attackCooldown * 0.8,
                    );

                    const description = `Кулдаун снизился на ${Util.timestampToDate(
                      current - userStats.attackCooldown,
                    )}`;

                    message.msg({
                      description,
                      footer: { iconURL: user.avatarURL(), text: user.tag },
                      delete: 8000,
                    });
                  });

                  collector.on("end", () => message.reactions.removeAll());
                },
              },
              "🧪🧪🍯": {
                description:
                  "Создаёт особый котёл, который дарует богатсва каждому, кто использует его. Однако его длительность ограничена одним часом или пятью использованиями!",
                callback: async (message, _embed) => {
                  await message.react("🍯");
                  const collector = message.createReactionCollector({
                    time: 3_600_000,
                  });
                  const gotTable = {};
                  collector.on("collect", (_reaction, user) => {
                    if (user.id in gotTable) {
                      message.msg({
                        title: "Вы уже воспользовались котлом",
                        color: "#ff0000",
                        delete: 3000,
                      });
                      return;
                    }

                    if (Object.keys(gotTable).length >= 5) {
                      collector.stop();
                    }

                    gotTable[user.id] = true;

                    user.data.chestBonus ||= 0;
                    user.data.chestBonus += 10;
                    const description = `Получено 10 бонусов сундука`;

                    message.msg({
                      description,
                      footer: { iconURL: user.avatarURL(), text: user.tag },
                      delete: 8000,
                    });
                  });

                  collector.on("end", () => message.reactions.removeAll());
                },
              },
              "🧪🧪🩸": {
                description:
                  "Сбрасывает перезарядку на атаку и уменьшает постоянный кулдаун в полтора раза",
                callback: (_message, _embed) => {
                  delete userStats.attack_CD;
                  userStats.attackCooldown = Math.floor(
                    userStats.attackCooldown / 1.5,
                  );
                },
              },
              "🧪🍯🍯": {
                description:
                  "Значительно уменьшает цену на волка из лавки босса",
                callback: (_message, _embed) => {
                  userStats.bought ||= {};
                  userStats.bought.wolf ||= 0;
                  userStats.bought.wolf -= 1;
                },
              },
              "🧪🩸🩸": {
                description:
                  "Значительно уменьшает цену на пазл из лавки босса",
                callback: (_message, _embed) => {
                  userStats.bought ||= {};
                  userStats.bought.puzzle ||= 0;
                  userStats.bought.puzzle -= 1;
                },
              },
              "🍯🍯🍯": {
                description: "Вы мгновенно получаете 45 бонусов сундука!",
                callback: (_message, _embed) => {
                  user.data.chestBonus ||= 0;
                  user.data.chestBonus += 45;
                },
              },
              "🩸🩸🩸": {
                description: "Босс теряет 7% от своего текущего здоровья",
                callback: (message, embed) => {
                  const thresholder =
                    BossManager.calculateHealthPointThresholder(boss.level);
                  const currentHealth = thresholder - boss.damageTaken;
                  const damage = Math.floor(currentHealth * 0.07);
                  BossManager.makeDamage(boss, damage, { sourceUser: user });

                  embed.edit = true;
                  embed.author = { name: `Нанесено ${damage}ед. урона` };
                  message.msg(embed);
                },
              },
              "🧪🍯🩸": {
                description: "Вы попросту перевели продукты..",
                callback: (_message, _embed) => {},
              },
              "🍯🍯🩸": {
                description: "Эффект кубика. Урон по боссу увеличен",
                callback: (_message, _embed) => {
                  boss.diceDamageMultiplayer ||= 1;
                  boss.diceDamageMultiplayer += 0.05;
                },
              },
              "🍯🩸🩸": {
                description:
                  "Наносит ещё одну атаку с увеличенным уроном. Множитель урона Х4",
                callback: (message, embed) => {
                  const previousDamage = attackContext.damageDealt;
                  const damage = previousDamage * 4;
                  BossManager.makeDamage(boss, damage, { sourceUser: user });

                  embed.edit = true;
                  embed.author = { name: `Нанесено ${damage}ед. урона` };
                  message.msg(embed);
                },
              },
            };

            const sort = (a, b) =>
              reactions.indexOf(a) > reactions.indexOf(b) ? 1 : -1;

            const key = ingredients.sort(sort).join("");
            const { callback, description } = spellsTable[key];
            return { callback, description };
          };

          const message = await channel.msg(embed);
          const filter = ({ emoji }, member) =>
            user === member && reactions.includes(emoji.name);
          const collector = message.createReactionCollector({
            filter,
            time: 90_000,
            max: 3,
          });
          collector.on("collect", async (reaction, user) => {
            reaction.users.remove(user);

            const emoji = reaction.emoji.name;

            ingredients.push(emoji);
            const MAX_INGEDIENTS = 3;

            const ingredientsContent = `[__${ingredients.join("")}__] + ${
              ingredients.length
            }/${MAX_INGEDIENTS}`;
            await channel.msg({
              description: ingredientsContent,
              delete: 3000,
            });

            if (ingredients.length === MAX_INGEDIENTS) {
              collector.stop();

              if (!Util.random(0, 15)) {
                const description =
                  "Вы попросту перевели ресурсы, варево неудалось";
                channel.msg({
                  title: "Мухомор, пудра, утконос",
                  description,
                  footer: { iconURL: user.avatarURL(), text: user.tag },
                });
                return;
              }

              const { callback, description } = createSpell(ingredients);
              const embed = {
                title: "Трепещи, босс, я изобрёл нечто!",
                description,
                footer: { iconURL: user.avatarURL(), text: user.tag },
              };
              const message = await channel.msg(embed);
              callback.call(null, message, embed);
            }
          });

          collector.on("end", () => message.delete());
        },
      },
      powerOfEarth: {
        weight: 1500,
        id: "powerOfEarth",
        description: "Вознаграждение за терпение",
        callback: ({ user, boss }) => {
          const berry = 3 + Math.ceil(boss.level / 2);
          user.data.berrys += berry;
        },
        filter: ({ boss }) => boss.elementType === elementsEnum.earth,
      },
      powerOfWind: {
        weight: 1500,
        id: "powerOfWind",
        description: "Уменьшает перезарядку на случайное значение",
        callback: ({ userStats }) => {
          const maximum = 0.2;
          const piece =
            Math.random() * userStats.attackCooldown * maximum +
            userStats.attackCooldown * (1 - maximum);
          userStats.attack_CD = Date.now() + piece;
          userStats.attackCooldown = piece;
        },
        filter: ({ boss }) => boss.elementType === elementsEnum.wind,
      },
      powerOfFire: {
        weight: 1500,
        id: "powerOfFire",
        description: "На что вы надеятесь?",
        callback: ({ boss }) => {
          boss.damageTaken -= 15 * boss.level;
        },
        filter: ({ boss }) => boss.elementType === elementsEnum.fire,
      },
      powerOfDarkness: {
        weight: 1500,
        id: "powerOfDarkness",
        description: "Вознагражение за настойчивость",
        callback: ({ user, boss }) => {
          const userData = user.data;
          userData.keys += 5 + boss.level * 2;
          userData.chestBonus = (userData.chestBonus || 0) + 2 + boss.level;
          userData.coins += 20 + 15 * boss.level;
        },
        filter: ({ boss }) => boss.elementType === elementsEnum.darkness,
      },
      powerOfEarthRare: {
        weight: 50,
        id: "powerOfEarthRare",
        description:
          "Вы получаете защиту от двух следующих негативных или нейтральных эффектов",
        callback: ({ user, guild }) => {
          const values = {
            influence: [
              EffectInfluenceEnum.Negative,
              EffectInfluenceEnum.Neutral,
            ],
            count: 2,
          };
          BossEffects.applyEffect({
            effectId: "boss.preventEffects",
            user,
            guild,
            values,
          });
        },
        filter: ({ boss }) => boss.elementType === elementsEnum.earth,
      },
      powerOfWindRare: {
        weight: 50,
        id: "powerOfWindRare",
        description: "Получено проклятие удачного коина",
        callback: (primary) => {
          const { user, guild } = primary;
          const curseBase = CurseManager.cursesBase.get("coinFever");
          const context = { guild, primary };
          const curse = CurseManager.generateOfBase({
            curseBase,
            user,
            context,
          });
          CurseManager.init({ curse, user });
        },
        filter: ({ boss }) => boss.elementType === elementsEnum.wind,
      },
      powerOfFireRare: {
        weight: 50,
        id: "powerOfFireRare",
        description: "Ваши прямые атаки наносят гораздо больше урона по боссу",
        callback: ({ user, boss, userStats }) => {
          const multiplier = 1.1;
          userStats.attacksDamageMultiplayer = +(
            (userStats.attacksDamageMultiplayer ?? 1) * multiplier
          ).toFixed(3);
        },
        filter: ({ boss }) => boss.elementType === elementsEnum.fire,
      },
      powerOfDarknessRare: {
        weight: 50,
        id: "powerOfDarknessRare",
        description: "Получена нестабильность. Перезарядка атаки свыше 8 ч.",
        callback: (primary) => {
          const adding = 3_600_000 * 8;
          const { user, userStats } = primary;
          userStats.attackCooldown += adding;
          userStats.attack_CD += adding;

          Util.addResource({
            user,
            value: 1,
            resource: PropertiesEnum.void,
            executor: user,
            source: "bossManager.attack.events.powerOfDarknessRare",
            context: primary,
          });
        },
        filter: ({ boss }) => boss.elementType === elementsEnum.darkness,
      },
      pests: {
        weight: ({ boss }) => 400 * 1.05 ** (boss.level - 10),
        id: "pests",
        description: "Клопы",
        callback: ({ user, boss, userStats }) => {
          const addingCooldowm = 60_000;
          userStats.attackCooldown += addingCooldowm;
          userStats.attack_CD += addingCooldowm;

          const decreaseMultiplayer = 0.005;
          userStats.attacksDamageMultiplayer ||= 1;
          userStats.attacksDamageMultiplayer -= decreaseMultiplayer;
        },
        repeats: true,
        filter: ({ boss }) => boss.level >= 10,
      },
      death: {
        weight: 70,
        id: "death",
        description: "Смэрть",
        callback: ({ userStats }) => {
          userStats.heroIsDead = true;
        },
        repeats: false,
        filter: ({ boss }) => boss.level >= 3,
      },
      theRarestEvent: {
        weight: 1,
        id: "theRarestEvent",
        description: "Вы получили один ключ ~",
        callback: ({ user }) => {
          user.data.keys += 1;
        },
      },
      takeRelicsShard: {
        weight: 20,
        id: "relics",
        description: "Получен осколок случайной реликвии",
        callback: ({ userStats, userData }) => {
          userStats.relicsShards ||= 0;
          userStats.relicsShards++;
          const NEED_SHARDS_TO_GROUP = 5;

          if (userStats.relicsShards <= NEED_SHARDS_TO_GROUP) {
            userStats.relicIsTaked = true;
            delete userStats.relicIsTaked;

            userData.bossRelics ||= [];

            const relicKey = BossRelics.collection
              .filter(
                (relic) =>
                  BossRelics.isUserHasRelic({ userData, relic }) &&
                  relic.inPull,
              )
              .randomKey();

            relicKey && userData.bossRelics.push(relicKey);
          }
        },
        filter: ({ boss, userStats }) => {
          return BossManager.isElite(boss) && !userStats.relicIsTaked;
        },
      },
      leaderRoar: {
        weight: 70,
        id: "leaderRoar",
        MULTIPLAYER: 15,
        TIMEOUT: 60_000 * 10,
        description: "Возглас лидера",
        async callback(context) {
          await Util.sleep(1000);
          const { guild, channel, boss, user } = context;
          const message = await context.fetchMessage();
          channel.sendTyping();
          await Util.sleep(4000);

          const owner = (await guild.fetchOwner())?.user ?? user;

          const TIMEOUT = this.TIMEOUT;
          const MULTIPLAYER = this.MULTIPLAYER;
          const whenOwnerMakeDamage = new Promise((resolve) => {
            const callback = (_user, effect, { actionName, data }) => {
              if (actionName !== Actions.bossMakeDamage) {
                return;
              }

              return resolve({ effect, data });
            };
            const { effect } = UserEffectManager.justEffect({
              effectId: "useCallback",
              user: owner,
              values: {
                callback,
              },
            });

            const outTimeout = () => resolve({ effect, data: null });
            setTimeout(outTimeout, TIMEOUT);
          });

          const embed = {
            reference: message.id,
            description: `Ждем до ${
              TIMEOUT / 60_000
            } м., пока ${owner.toString()} нанесёт урон боссу. Вы нанесёте в ${Util.ending(
              MULTIPLAYER,
              "раз",
              "",
              "",
              "а",
            )} больше от этого значения`,
          };

          const showsMessage = await channel.msg(embed);

          const { effect, data } = await whenOwnerMakeDamage;
          UserEffectManager.removeEffect({ effect, user: owner });
          if (!data) {
            embed.description += "\n\nНе дождались...";
            showsMessage.msg({ ...embed, edit: true });
            return;
          }
          const { baseDamage, damageSourceType } = data;
          const damageDealt = BossManager.makeDamage(
            boss,
            baseDamage * MULTIPLAYER,
            {
              sourceUser: user,
              damageSourceType,
            },
          );
          embed.description += `\n\nДождались.., — наносит ${baseDamage} базового урона от источника ${BossUtils.damageTypeLabel(
            damageSourceType,
          )}.\nВы наносите в ${Util.ending(
            MULTIPLAYER,
            "раз",
            "",
            "",
            "а",
          )} больше: ${damageDealt} ед. урона`;
          showsMessage.msg({ ...embed, edit: true });
        },
      },
      refrigerator: {
        weight: 100,
        id: "refrigerator",
        description: "Стужа",
        callback(content) {
          content.attackContext.damageMultiplayer = 0;
        },
        filter: ({ boss }) => Speacial.isSnowQueen(boss),
      },
      // ______e4example: {
      //   _weight: 2,
      //   id: "______e4example",
      //   description: "Требуется совершить выбор",
      //   callback: async ({user, boss, channel, userStats}) => {
      //   }
      // }
    }),
  );

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

  static USER_DEFAULT_ATTACK_COOLDOWN = 3_600_000 * 2;
  static USER_DEFAULT_ATTACK_DAMAGE = 10;

  static BossShop = BossShop;
  static BossEvents = BossEvents;
  static BossRelics = BossRelics;
  static BossEffects = BossEffects;
  static Speacial = Speacial;
}

export {
  BossManager,
  BossShop,
  BossEvents,
  BossEffects,
  LegendaryWearonList,
  Speacial as BossSpecial,
};
export default BossManager;
