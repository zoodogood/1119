/* eslint-disable no-unused-vars */

import app from "#app";
import config from "#config";
import { ActionsMap } from "#constants/enums/actionsMap.js";
import { DAY, HOUR, MINUTE, MONTH, SECOND } from "#constants/globals/time.js";
import { Elements, elementsEnum } from "#folder/commands/thing.js";
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
import { RewardSystem } from "#folder/entities/boss/reward.js";
import { createDefaultPreventable } from "#lib/createDefaultPreventable.js";
import {
  EffectInfluenceEnum,
  UserEffectManager,
} from "#lib/modules/EffectsManager.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import {
  CommandsManager,
  CurseManager,
  DataManager,
  Properties,
} from "#lib/modules/mod.js";
import {
  NumberFormatLetterize,
  addResource,
  ending,
  getRandomElementFromArray,
  question,
  random,
  sleep,
  timestampDay,
  timestampToDate,
  toFixedAfterZero,
} from "#lib/util.js";
import {
  current_health_thresholder,
  update_health_thresholder,
} from "#root/folder/entities/boss/health.js";
import { Collection } from "@discordjs/collection";
import { justButtonComponents } from "@zoodogood/utils/discordjs";
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

class Utils {
  static damageTypeLabel(value) {
    const numeric =
      typeof value === "string" ? BossManager.DAMAGE_SOURCES[value] : value;
    return BossManager.DAMAGE_SOURCES[numeric].label;
  }
}

class AttributesShop {
  static PRODUCTS = new Collection(
    Object.entries({
      "🧩": {
        emoji: "🧩",
        keyword: "puzzle",
        description: "Множитель атаки: 1.25",
        basePrice: 100,
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
            `${label}\n${price} ${Properties.endingOf(
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
      )} <:coin:637533074879414272> и ${ending(
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

  static _removeEffect({ effect, user }) {
    const index = UserEffectManager.indexOf({ effect, user });
    if (index === -1) {
      return null;
    }

    user.action(ActionsMap.bossEffectEnd, { effect, index });
    UserEffectManager.removeEffect({ effect, user });
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

  static eventBases = new Collection(
    Object.entries({
      increaseAttackCooldown: {
        weight: 1500,
        id: "increaseAttackCooldown",
        description: "Перезарядка атаки больше на 20 минут",
        callback: (context) => {
          const { boss, user, userStats } = context;
          update_attack_cooldown(user, boss, "", context, MINUTE * 20);
        },
        filter: ({ attackContext }) =>
          !attackContext.listOfEvents.some(({ id }) =>
            ["reduceAttackDamage"].includes(id),
          ),
      },
      increaseCurrentAttackDamage: {
        weight: 4500,
        repeats: true,
        id: "increaseCurrentAttackDamage",
        description: "Урон текущей атаки был увеличен",
        callback: ({ attackContext }) => {
          attackContext.damageMultiplayer *= 5;
        },
      },
      increaseNextTwoAttacksDamage: {
        weight: 1_000,
        repeats: true,
        id: "increaseNextTwoAttacksDamage",
        description: "Урон следующих двух атак был увеличен",
        callback: ({ guild, user }) => {
          const effectId = "boss.increaseAttackDamage";
          const values = { repeats: 2, power: 2.5 };
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
          const hard = (random(boss.level) > 20) + (random(boss.level) > 50);
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
      applyManyCurses: {
        weight: 40,
        id: "applyManyCurses",
        description: "Много проклятий",
        callback: ({ user, boss, channel }) => {
          for (let i = 0; i < random(2, 3); i++) {
            const hard = (random(boss.level) > 20) + (random(boss.level) > 50);
            const curse = CurseManager.generate({
              user,
              hard,
              context: { guild: channel.guild },
            });
            CurseManager.init({ user, curse });
          }
        },
        filter: ({ user }) =>
          !user.data.curses?.length || user.data.voidFreedomCurse,
      },
      unexpectedShop: {
        weight: 20,
        id: "unexpectedShop",
        description: "Требуется заглянуть в лавку торговца",
        callback: async (context) => {
          const { channel, user } = context;
          await sleep(1 * SECOND);
          await channel.msg({
            description:
              "Каждый купленный в лавке предмет нанесёт урон по боссу, равный его цене",
          });

          const { effect } = UserEffectManager.justEffect({
            effectId: "useCallback",
            user,
            values: {
              callback: (_user, _effect, { actionName, data }) => {
                if (actionName !== ActionsMap.buyFromGrempen) {
                  return;
                }
                const { product } = data;

                const damage = BossManager.makeDamage(
                  context.boss,
                  product.value,
                  {
                    sourceUser: context.user,
                    damageSourceType: BossManager.DAMAGE_SOURCES.other,
                  },
                );

                data.phrase += `\nТык: ${damage} ед.`;
              },
            },
          });
          setTimeout(
            () => UserEffectManager.interface({ effect, user }).remove(),
            MINUTE * 10,
          );
          const interactionClone = {
            ...context,
            extend: {
              slots: [
                {
                  index: 0,
                  product: {
                    key: "_",
                    label: "Подарочек",
                    emoji: "🎁",
                    value: 300,
                    fn() {
                      return "Спасибо, что купили меня!";
                    },
                  },
                  price: 300,
                },
              ],
              disableSyncSlots: true,
            },
            phrase: "",
          };

          CommandsManager.collection
            .get("grempen")
            .onChatInput(null, interactionClone);
        },
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
          const { user, boss, channel } = parentContext;
          const ActionsEnum = {
            Hit: "hit",
            Leave: "leave",
          };

          channel.sendTyping();
          await sleep(2000);
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
            reference: executorMessage?.id,
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
              time: MINUTE,
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

          const base = 1500 + 30 * 1.2 ** boss.level;

          const per_level = base / 15;
          const damage = boss.level * per_level + base;

          const dealt = BossManager.makeDamage(boss, damage, {
            sourceUser: user,
          });

          update_attack_cooldown(user, boss, "", parentContext, MINUTE * 30);

          embed.description = `Нанесено ${NumberFormatLetterize(dealt)} ед. урона.`;

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

              const adding = MINUTE * 7.5;
              update_attack_cooldown(user, boss, "", parentContext, adding);

              if (random(20) === 0) {
                embed.description += `\n~ Перезарядка увеличена ещё на ${timestampToDate(
                  adding,
                )}`;
                collector.stop();
                return;
              }

              const addable = (Math.random(base) + 0.5 + base) / 10;
              const per_iteration = addable / 7;
              const per_level = addable / 15;
              const damage =
                per_level * boss.level + per_iteration * counter + addable;

              const dealt = BossManager.makeDamage(boss, damage, {
                sourceUser: user,
              });
              embed.description += `\n~ Нанесено ещё ${NumberFormatLetterize(dealt)} ед. урона`;

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
        weight: 800,
        id: "choiseAttackDefense",
        description: "Требуется совершить выбор",
        callback: async (context) => {
          const { user, boss, channel, userStats } = context;
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
          await sleep(2000);

          const message = await channel.msg(embed);
          const filter = ({ emoji }, member) =>
            user === member && reactions.includes(emoji.name);
          const collector = message.createReactionCollector({
            filter,
            time: 30_000,
            max: 1,
          });
          collector.on("collect", (reaction) => {
            const isLucky = random(0, 1);
            const emoji = reaction.emoji.name;

            if (!isLucky) {
              update_attack_cooldown(user, boss, "", context, 0, HOUR * 20);
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
        filter: ({ boss }) => boss.level <= 10,
      },
      selectLegendaryWearon: {
        weight: Infinity,
        id: "selectLegendaryWearon",
        description: "Требуется совершить выбор",
        callback: async (context) => {
          const { LegendaryWearonList: wearons } = Speacial;
          const { user, channel, userStats, guild } = context;
          const reactions = [...wearons.values()].map(({ emoji }) => emoji);
          const getLabel = ({ description, emoji }) =>
            `${emoji} ${description}.`;
          const embed = {
            description: `**Выберите инструмент с привлекательным для Вас эпическим эффектом:**\n${wearons
              .map(getLabel)
              .join("\n")}`,
            color: "#3d17a0",
            reactions,
            footer: {
              iconURL: user.avatarURL(),
              text: "Это событие появляется единожды",
            },
          };

          channel.sendTyping();
          await sleep(2000);

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
            const wearon = wearons.find((wearon) => wearon.emoji === emoji);
            if (!wearon) {
              throw new Error("Unexpected Exception");
            }

            const values = Object.fromEntries(
              Object.entries(wearon.values).map(([key, value]) => [
                key,
                value(context),
              ]),
            );
            values.isLegendaryWearon = true;
            values.canPrevented = false;

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
            await sleep(10_000);
            collector.stop();
          });

          collector.on("end", () => message.reactions.removeAll());
        },

        filter: ({ userStats, boss }) =>
          !userStats.haveLegendaryWearon &&
          boss.level >= 5 &&
          userStats.attacksCount >= 7 &&
          userStats.attacksCount % 3 === 1,
      },
      choiseCreatePotion: {
        weight: 300,
        id: "choiseCreatePotion",
        description: "Требуется совершить выбор",
        callback: async (context) => {
          const { user, boss, channel, userStats, attackContext } = context;
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
          await sleep(2000);

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

                    const description = `Кулдаун снизился на ${timestampToDate(
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
                  update_attack_cooldown(
                    user,
                    boss,
                    "",
                    context,
                    (previous) => previous / 1.5,
                    () => 0,
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
                description: "Босс теряет 2% от своего текущего здоровья",
                callback: (message, embed) => {
                  const thresholder =
                    BossManager.calculateHealthPointThresholder(boss.level);
                  const currentHealth = thresholder - boss.damageTaken;
                  const damage = Math.floor(currentHealth * 0.02);
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
                callback: async (message, embed) => {
                  const previousDamage = attackContext.damageDealt;

                  const _context = core_make_attack_context(
                    boss,
                    user,
                    channel,
                    context,
                  );
                  _context.attackContext.addableDamage += previousDamage * 4;
                  const pull = resolve_attack_events_pull(_context);
                  const event = getRandomElementFromArray(pull, {
                    associatedWeights: pull.map(({ _weight }) => _weight),
                  });
                  attack_event_callback(event, _context);
                  _context.attackContext.listOfEvents.push(event);
                  core_make_attack(_context);
                  _context.message = await display_attack(_context);
                  const { dealt } = _context.afterAttack;

                  embed.edit = true;
                  embed.author = {
                    name: `Нанесено ${NumberFormatLetterize(dealt)}ед. урона`,
                  };
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

              if (!random(0, 15)) {
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
        weight: 1000,
        id: "powerOfEarth",
        description: "Вознаграждение за терпение",
        callback: ({ user, boss }) => {
          const berry = 2 + Math.ceil(boss.level / 4);
          user.data.berrys += berry;
        },
        filter: ({ boss }) => boss.elementType === elementsEnum.earth,
      },
      powerOfWind: {
        weight: 1000,
        id: "powerOfWind",
        description: "Уменьшает перезарядку на случайное значение",
        callback: (context) => {
          const { userStats, user, boss } = context;
          const maximum = 0.2;
          const piece =
            Math.random() * userStats.attackCooldown * maximum +
            userStats.attackCooldown * (1 - maximum);
          update_attack_cooldown(
            user,
            boss,
            "",
            context,
            (previous) => previous * piece,
          );
        },
        filter: ({ boss }) => boss.elementType === elementsEnum.wind,
      },
      powerOfFire: {
        weight: 1000,
        id: "powerOfFire",
        description: "На что вы надеятесь?",
        callback: ({ boss }) => {
          boss.damageTaken -= 15 * boss.level;
        },
        filter: ({ boss }) => boss.elementType === elementsEnum.fire,
      },
      powerOfDarkness: {
        weight: 1000,
        id: "powerOfDarkness",
        description: "Вознагражение за настойчивость",
        callback: ({ user, boss }) => {
          const userData = user.data;
          userData.keys += 3 + boss.level * 2;
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
        callback: (context) => {
          const { user, boss } = context;
          const multiplayer = 1.1;
          update_attack_damage_multiplayer(
            user,
            boss,
            "",
            context,
            (previous) => previous * multiplayer,
          );
        },
        filter: ({ boss }) => boss.elementType === elementsEnum.fire,
      },
      powerOfDarknessRare: {
        weight: 50,
        id: "powerOfDarknessRare",
        description: "Получена нестабильность. Перезарядка атаки свыше 8 ч.",
        callback: (primary) => {
          const { user, userStats, boss } = primary;
          update_attack_cooldown(user, boss, "", primary, HOUR * 8);

          addResource({
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
        weight: ({ boss }) => 200 * 1.05 ** (boss.level - 10),
        id: "pests",
        description: "Клопы",
        callback: (context) => {
          const { user, boss, userStats } = context;
          const addingCooldowm = 30 * SECOND;
          update_attack_cooldown(user, boss, "", context, addingCooldowm);

          const decreaseMultiplayer = 0.995;
          update_attack_damage_multiplayer(
            user,
            boss,
            "",
            context,
            (previous) => previous * decreaseMultiplayer,
          );
        },
        repeats: true,
        filter: ({ boss }) => boss.level >= 10,
      },
      pests_effect: {
        weight: ({ boss }) => 20 * 1.05 ** (boss.level - 10),
        id: "pests_effect",
        description: "Слабость следущие 20 минут",
        callback: (context) => {
          const { user, boss, userStats } = context;
          UserEffectManager.justEffect({
            effectId: "boss.decreaseAttackDamage",
            user,
            values: {
              power: 0.2,
              repeats: Number.MAX_SAFE_INTEGER,
              timer: 20 * MINUTE,
            },
            context,
          });
        },
        repeats: true,
        filter: ({ boss }) => boss.level >= 10,
      },
      firstPest: {
        weight: 30,
        id: "firstPest",
        description: "Уменьшающий урон клоп",
        callback: async (context) => {
          const { attackContext, user, boss } = context;
          const { listOfEvents } = attackContext;
          if (listOfEvents.length >= attackContext.eventsCount) {
            return;
          }
          update_attack_damage_multiplayer(
            user,
            boss,
            "firstPest",
            context,
            (previous) => previous * 0.9,
          );

          if (random(1)) {
            return;
          }
          attackContext.eventsCount--;
          const event = BossManager.eventBases.get("secondPest");
          attack_event_callback(event, context);
          attackContext.listOfEvents.push(event);
        },
        filter: ({ boss }) => boss.level >= 10 && boss.level <= 40,
      },
      secondPest: {
        weight: 0,
        id: "secondPest",
        description: "Увеличивающий перезарядку клоп",
        callback: async (context) => {
          const { attackContext, user, boss } = context;
          const { listOfEvents } = attackContext;
          if (listOfEvents.length >= attackContext.eventsCount) {
            return;
          }
          if (random(1)) {
            return;
          }
          attackContext.eventsCount--;
          const event = BossManager.eventBases.get("thirdPest");
          update_attack_cooldown(
            user,
            boss,
            "secondPest",
            context,
            SECOND * 15,
          );
          attack_event_callback(event, context);
          attackContext.listOfEvents.push(event);
        },
        filter: () => false,
      },
      thirdPest: {
        weight: 0,
        id: "thirdPest",
        description: "Добавляющий событий клоп",
        callback: async (context) => {
          context.attackContext.eventsCount += 4;
        },
        filter: () => false,
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
        callback: ({ userStats, user }) => {
          const userData = user.data;
          userStats.relicsShards ||= 0;
          userStats.relicsShards++;
          const NEED_SHARDS_TO_GROUP = 5;

          if (userStats.relicsShards >= NEED_SHARDS_TO_GROUP) {
            userStats.relicIsTaked = true;
            delete userStats.relicIsTaked;

            user.data.bossRelics ||= [];

            const relicKey = Relics.collection
              .filter(
                (relic) =>
                  Relics.isUserHasRelic({ userData, relic }) && relic.inPull,
              )
              .randomKey();

            relicKey && user.data.bossRelics.push(relicKey);
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
        TIMEOUT: MINUTE * 15,
        description: "Возглас лидера",
        async callback(context) {
          await sleep(1000);
          const { guild, channel, boss, user } = context;
          const message = await context.fetchMessage();
          channel.sendTyping();
          await sleep(4000);

          const owner = (await guild.fetchOwner())?.user ?? user;

          const TIMEOUT = this.TIMEOUT;
          const MULTIPLAYER = this.MULTIPLAYER;

          const whenOwnerMakeDamage = new Promise((resolve) => {
            const callback = (_user, effect, { actionName, data }) => {
              if (actionName !== ActionsMap.bossMakeDamage) {
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

            // to-do: developer crutch
            if (!effect) {
              throw new Error("Effect not be returned");
            }

            const outTimeout = () => resolve({ effect, data: null });
            setTimeout(outTimeout, TIMEOUT);
          });

          const embed = {
            reference: message.id,
            description: `Ждем до ${
              TIMEOUT / 60_000
            } м., пока ${owner.toString()} нанесёт урон боссу. Вы нанесёте в ${ending(
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
          embed.description += `\n\nДождались.., — наносит ${baseDamage} базового урона от источника ${Utils.damageTypeLabel(
            damageSourceType,
          )}.\nВы наносите в ${ending(
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
      preventPositiveEffects: {
        weight: 100,
        id: "preventPositiveEffects",
        description: "Предотвращает два следующих позитивных эффекта",
        callback: ({ user, guild }) => {
          const values = {
            influence: [EffectInfluenceEnum.Positive],
            count: 2,
          };
          BossEffects.applyEffect({
            effectId: "boss.preventEffects",
            user,
            guild,
            values,
          });
        },
      },
      forging: {
        weight: 100,
        id: "forging",
        repeats: true,
        description: "Эффект легендарного оружия усилен, обычный урон ослаблен",
        callback: async (context) => {
          const { user, boss, channel, userStats } = context;
          const effect = BossEffects.effectsOf({ boss, user }).find(
            (effect) => effect.values.isLegendaryWearon,
          );
          if (!effect) {
            channel.msg({
              content: `Упс, легендарного оружия не найдено! Как так?\nТак быть не должно и вы можете связаться с [сервером поддержки](${config.guild.url})`,
            });
            return;
          }

          const effectMultiplayer = 0.2;
          effect.values.multiplayer += effectMultiplayer;
          const damageMultiplayer = 0.95;
          update_attack_damage_multiplayer(
            user,
            boss,
            "",
            context,
            (previous) => previous * damageMultiplayer,
          );
        },
        filter: ({ userStats }) => userStats.haveLegendaryWearon,
      },

      seemed: {
        weight: 0,
        id: "seemed",
        description: "Требуется совершить выбор",
        callback: async ({ user, boss, channel, userStats }) => {
          // to-do
          const embed = {
            author: { name: user.username, iconURL: user.avatarURL() },
            description:
              "Упомяните активного участника или укажите его айди, чтобы наложить на него проклятие, если он не справится, вы получите нестабильность; или заплатите 5 000 коинов, чтобы эффект прошел",
            footer: {
              iconURL: user.avatarURL(),
              text: "Это действие нельзя пропустить",
            },
          };

          channel.sendTyping();
          await sleep(2000);

          const response = await question({ message: embed, user, channel });
          if (!response) {
            return;
          }
        },
      },
      andWhoStronger: {
        weight: 5,
        id: "andWhoStronger",
        description: "Викторина",
        REACTIONS: {
          FirstByDamage: "1️⃣",
          SecondByDamage: "2️⃣",
          Nothing: "💠",
        },
        ID_OF_NOTHING_USER: "none",
        EFFECT_ID: "bossManager.attack.events.andWhoStronger",
        userOnCorrectAnswer(user, selected, context) {
          const isSelectedNothing = selected === this.ID_OF_NOTHING_USER;
          isSelectedNothing
            ? addResource({
                user,
                executor: null,
                context,
                source: `bossManager.attack.events.andWhoStronger.userOnCorrectAnswer`,
                value: 1,
                resource: PropertiesEnum.void,
              })
            : addResource({
                user,
                executor: null,
                context,
                source: `bossManager.attack.events.andWhoStronger.userOnCorrectAnswer`,
                value: 50,
                resource: PropertiesEnum.keys,
              });
          user.msg({
            description: `Вы ответили правильно в викторине (${this.EFFECT_ID})!\nПолучите Вашу награду. Вроде бы это 1 нестабильность или 50 ключей`,
          });
        },
        async onBossEnd(context) {
          const { boss, mostStrongUser, usersStatsEntries } = context;
          for (const [userId, userStats] of usersStatsEntries) {
            if (this.EFFECT_ID in userStats === false) {
              continue;
            }
            const { id, strongest } = userStats[`${this.EFFECT_ID}`];

            const user = app.client.users.cache.get(userId);
            if (mostStrongUser.id === id) {
              this.userOnCorrectAnswer(user, id, context);
              continue;
            }

            if (
              id === this.ID_OF_NOTHING_USER &&
              !strongest.includes(mostStrongUser.id)
            ) {
              this.userOnCorrectAnswer(user, id, context);
              continue;
            }
          }
        },
        async onSelectWinner(interaction, context) {
          const { participantsContext, userStats, user } = context;
          const { reaction, strongest } = participantsContext;
          const { REACTIONS } = this;
          const INDEXES = {
            [REACTIONS.FirstByDamage]: 0,
            [REACTIONS.SecondByDamage]: 1,
            [REACTIONS.Nothing]: null,
          };
          const emoji = reaction.emoji.name;
          const selectedUser = strongest[INDEXES[emoji]]?.at(0) ?? {
            toString() {
              return "Никто из них";
            },
            id: this.ID_OF_NOTHING_USER,
          };
          interaction.msg({
            edit: true,
            author: {
              name: `Викторина | ${user.username}`,
              iconURL: user.avatarURL(),
            },
            description: `😛?, Ставка сделана: ${selectedUser}`,
          });

          userStats[`${this.EFFECT_ID}`] = {
            id: selectedUser.id,
            strongest: strongest.map(([user]) => user.id),
          };
        },
        async onParcitipate(interaction, context) {
          const { boss, guild, user } = context;
          const damageOfEntry = (entry) => entry?.at(1).damageDealt || 0;
          const strongest = Object.entries(boss.users)
            .reduce((acc, entry) => {
              const [first, second] = acc;
              if (damageOfEntry(entry) > damageOfEntry(first)) {
                return [entry, first];
              }
              if (damageOfEntry(entry) > damageOfEntry(second)) {
                return [first, entry];
              }
              return acc;
            }, [])
            .filter(Boolean)
            .map((entry) => [
              guild.members.cache.get(entry[0]),
              damageOfEntry(entry),
            ]);

          const { REACTIONS } = this;
          const reactions = [
            ...[REACTIONS.FirstByDamage, REACTIONS.SecondByDamage].slice(
              0,
              strongest.length,
            ),
            REACTIONS.Nothing,
          ];
          const contents = {
            description:
              "У нас есть два лидера, угадайте кто нанесёт больше урона к концу события и получите 50 ключей. Если вы верите в другого участника, выберите опцию «никто из них» и, в случае верного предсказания, получите одну нестабильность:",
            strongest: `**Вот наши первосилачи:**\n${strongest.map(([memb, damage], i) => `${reactions[i]} ${memb.toString()}, — ${NumberFormatLetterize(damage)}`).join("\n")}\n${REACTIONS.Nothing} Никто из них`,
          };
          const message = await interaction.msg({
            description: `${contents.description}\n${contents.strongest}`,
            author: { name: user.username, iconURL: user.avatarURL() },
            fetchReply: true,
            reactions,
          });

          const participantsContext = {
            message,
            reactions,
            strongest,
          };
          Object.assign(context, { participantsContext });

          const collector = message.createReactionCollector();
          collector.on("collect", async (reaction, _user) => {
            if (_user.id !== interaction.user.id) {
              return;
            }
            participantsContext.reaction = reaction;
            this.onSelectWinner(interaction, context);
            collector.stop();
          });
          collector.on("end", () => message.reactions.removeAll());
        },
        async callback(context) {
          const { user, boss, channel, userStats, guild } = context;
          await sleep(500);
          channel.sendTyping();
          await sleep(5_000);

          const embed = {
            content: ":wave:",
          };

          const preview = await channel.msg(embed);
          await sleep(1_200);

          Object.assign(embed, {
            author: { name: user.username, iconURL: user.avatarURL() },
            title: "Викторина",
            description:
              "Кто сильнее? Сделайте ставку кто из текущих лидеров урона по боссу нанесёт больше урона к концу",
            components: justButtonComponents({ label: "Участвовать" }),
            edit: true,
          });

          preview.msg(embed);
          const collector = preview.createMessageComponentCollector();

          collector.on("collect", async (interaction) => {
            if (interaction.user.id !== user.id) {
              interaction.msg({
                ephemeral: true,
                content: `Это взаимодействие доступно только ${user.username}`,
              });
              return;
            }

            this.onParcitipate(interaction, context);
            collector.stop();
          });

          collector.on("end", async () => {
            preview.msg({ components: [], edit: true });
          });
        },
        filter({ guild, boss, userStats }) {
          return (
            boss.level >= 3 &&
            Object.keys(boss.users).length > 2 &&
            this.EFFECT_ID in userStats === false
          );
        },
      },
      baseOfPercentage: {
        weight: 200,
        id: "baseOfPercentage",
        description: "Базовый урон равен 0.007% от масимального здоровья босса",
        callback: async ({ attackContext, boss }) => {
          attackContext.baseDamage = Math.ceil(
            current_health_thresholder(boss) * 0.00007,
          );
        },
        filter: ({ boss }) => boss.level >= 10 && boss.level <= 30,
      },
      periodOfPlenty: {
        weight: 100,
        repeats: true,
        id: "periodOfPlenty",
        description: "Период изобилия",
        callback: async (context) => {
          const { user, boss } = context;
          const SUPER_MULTIPLAYER = 10;
          update_attack_damage_multiplayer(
            user,
            boss,
            "",
            context,
            (previous) => previous + SUPER_MULTIPLAYER,
          );
        },
        filter: ({ boss }) => boss.level >= 15 && boss.level <= 30,
      },
      // ______e4example: {
      //   weight: 2,
      //   id: "______e4example",
      //   description: "Требуется совершить выбор",
      //   callback: async ({user, boss, channel, userStats}) => {
      //   }
      // }
    }),
  );

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
        const index = pull.indexOf(base);
        ~index && pull.splice(index, 1);
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

export { AttributesShop, BossEffects, BossEvents, BossManager, Speacial };
export default BossManager;
