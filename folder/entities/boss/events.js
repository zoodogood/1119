import app from "#app";
import { question, transformToCollectionUsingKey } from "#bot/util.js";
import config from "#config";
import { ActionsMap } from "#constants/enums/actionsMap.js";
import { HOUR, MINUTE, SECOND } from "#constants/globals/time.js";
import { Elements, elementsEnum } from "#folder/commands/thing.js";
import {
  core_make_attack,
  core_make_attack_context,
  display_attack,
  update_attack_cooldown,
  update_attack_damage_multiplayer,
} from "#folder/entities/boss/attack.js";
import {
  attack_event_callback,
  resolve_attack_events_pull,
} from "#folder/entities/boss/attack_events.js";
import { damageTypeLabel } from "#folder/entities/boss/formatters.js";
import { current_health_thresholder } from "#folder/entities/boss/health.js";
import BossManager, {
  BossEffects,
  BossRelics,
  BossSpecial,
} from "#lib/modules/BossManager.js";
import CommandsManager, {
  CommandInteraction,
} from "#lib/modules/CommandsManager.js";
import CurseManager from "#lib/modules/CurseManager.js";
import UserEffectManager, {
  EffectInfluenceEnum,
} from "#lib/modules/EffectsManager.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import {
  NumberFormatLetterize,
  ending,
  getRandomElementFromArray,
  random,
  sleep,
  timestampToDate,
} from "#lib/safe-utils.js";
import { addResource } from "#lib/util.js";
import { justButtonComponents } from "@zoodogood/utils/discordjs";
import { ButtonStyle, ComponentType } from "discord.js";

export const eventBases = transformToCollectionUsingKey([
  {
    weight: 1500,
    key: "increaseAttackCooldown",
    description: "Перезарядка атаки больше на 20 минут",
    callback: (context) => {
      const { boss, user } = context;
      update_attack_cooldown(user, boss, "", context, MINUTE * 20);
    },
    filter: ({ attackContext }) =>
      !attackContext.listOfEvents.some(({ id }) =>
        ["reduceAttackDamage"].includes(id),
      ),
  },
  {
    weight: 4500,
    repeats: true,
    key: "increaseCurrentAttackDamage",
    description: "Урон текущей атаки был увеличен",
    callback: ({ attackContext }) => {
      attackContext.damageMultiplayer *= 5;
    },
  },
  {
    weight: 1_000,
    repeats: true,
    key: "increaseNextTwoAttacksDamage",
    description: "Урон следующих двух атак был увеличен",
    callback: ({ guild, user }) => {
      const effectId = "boss.increaseAttackDamage";
      const values = { repeats: 2, power: 2.5 };
      BossEffects.applyEffect({ values, guild, user, effectId });
    },
  },
  {
    weight: 1200,
    key: "giveChestBonus",
    description: "Выбито 4 бонуса сундука",
    callback: ({ user }) => {
      user.data.chestBonus = (user.data.chestBonus ?? 0) + 4;
    },
  },
  {
    weight: 900,
    key: "applyCurse",
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
  {
    weight: 40,
    key: "applyManyCurses",
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
  {
    weight: 20,
    key: "unexpectedShop",
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

            const damage = BossManager.makeDamage(context.boss, product.value, {
              sourceUser: context.user,
              damageSourceType: BossManager.DAMAGE_SOURCES.other,
            });

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
        .onChatInput(
          null,
          Object.assign(
            Object.create(CommandInteraction.prototype),
            interactionClone,
          ),
        );
    },
  },
  {
    weight: 300,
    key: "improveDamageForAll",
    description: "Кубик — урон по боссу увеличен на 1%",
    callback: ({ boss }) => {
      boss.diceDamageMultiplayer ||= 1;
      boss.diceDamageMultiplayer += 0.01;
    },
    filter: ({ boss }) => boss.diceDamageMultiplayer,
  },
  {
    weight: 200,
    key: "superMegaAttack",
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
  {
    weight: 800,
    key: "choiseAttackDefense",
    description: "Требуется совершить выбор",
    callback: async (context) => {
      const { user, boss, channel } = context;
      const reactions = ["⚔️", "🛡️"];
      const embed = {
        author: { name: user.username, iconURL: user.avatarURL() },
        description: "Вас атакуют!\n— Пытаться контратаковать\n— Защитная поза",
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
  {
    weight: Infinity,
    key: "selectLegendaryWearon",
    description: "Требуется совершить выбор",
    callback: async (context) => {
      const { LegendaryWearonList: wearons } = BossSpecial;
      const { user, channel, userStats, guild } = context;
      const reactions = [...wearons.values()].map(({ emoji }) => emoji);
      const getLabel = ({ description, emoji }) => `${emoji} ${description}.`;
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
  {
    weight: 300,
    key: "choiseCreatePotion",
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
                const difference = update_attack_cooldown(
                  user,
                  boss,
                  "",
                  context,
                  (current) => current * 0.8,
                );

                const description = `Кулдаун снизился на ${timestampToDate(
                  difference,
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
            description: "Значительно уменьшает цену на волка из лавки босса",
            callback: (_message, _embed) => {
              userStats.bought ||= {};
              userStats.bought.wolf ||= 0;
              userStats.bought.wolf -= 1;
            },
          },
          "🧪🩸🩸": {
            description: "Значительно уменьшает цену на пазл из лавки босса",
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
              const thresholder = BossManager.calculateHealthPointThresholder(
                boss.level,
              );
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
  {
    weight: 1000,
    key: "powerOfEarth",
    description: "Вознаграждение за терпение",
    callback: ({ user, boss }) => {
      const berry = 2 + Math.ceil(boss.level / 4);
      user.data.berrys += berry;
    },
    filter: ({ boss }) => boss.elementType === elementsEnum.earth,
  },
  {
    weight: 1000,
    key: "powerOfWind",
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
  {
    weight: 1000,
    key: "powerOfFire",
    description: "На что вы надеятесь?",
    callback: ({ boss }) => {
      boss.damageTaken -= 15 * boss.level;
    },
    filter: ({ boss }) => boss.elementType === elementsEnum.fire,
  },
  {
    weight: 1000,
    key: "powerOfDarkness",
    description: "Вознагражение за настойчивость",
    callback: ({ user, boss }) => {
      const userData = user.data;
      userData.keys += 3 + boss.level * 2;
      userData.chestBonus = (userData.chestBonus || 0) + 2 + boss.level;
      userData.coins += 20 + 15 * boss.level;
    },
    filter: ({ boss }) => boss.elementType === elementsEnum.darkness,
  },
  {
    weight: 50,
    key: "powerOfEarthRare",
    description:
      "Вы получаете защиту от двух следующих негативных или нейтральных эффектов",
    callback: ({ user, guild }) => {
      const values = {
        influence: [EffectInfluenceEnum.Negative, EffectInfluenceEnum.Neutral],
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
  {
    weight: 50,
    key: "powerOfWindRare",
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
  {
    weight: 50,
    key: "powerOfFireRare",
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
  {
    weight: 50,
    key: "powerOfDarknessRare",
    description: "Получена нестабильность. Перезарядка атаки свыше 8 ч.",
    callback: (primary) => {
      const { user, boss } = primary;
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
  {
    weight: ({ boss }) => 200 * 1.05 ** (boss.level - 10),
    key: "pests",
    description: "Клопы",
    callback: (context) => {
      const { user, boss } = context;
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
  {
    weight: ({ boss }) => 20 * 1.05 ** (boss.level - 10),
    key: "pests_effect",
    description: "Слабость следущие 20 минут",
    callback: (context) => {
      const { user } = context;
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
  {
    weight: 30,
    key: "firstPest",
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
  {
    weight: 0,
    key: "secondPest",
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
      update_attack_cooldown(user, boss, "secondPest", context, SECOND * 15);
      attack_event_callback(event, context);
      attackContext.listOfEvents.push(event);
    },
    filter: () => false,
  },
  {
    weight: 0,
    key: "thirdPest",
    description: "Добавляющий событий клоп",
    callback: async (context) => {
      context.attackContext.eventsCount += 4;
    },
    filter: () => false,
  },
  {
    weight: 70,
    key: "death",
    description: "Смэрть",
    callback: ({ userStats }) => {
      userStats.heroIsDead = true;
    },
    repeats: false,
    filter: ({ boss }) => boss.level >= 3,
  },
  {
    weight: 1,
    key: "theRarestEvent",
    description: "Вы получили один ключ ~",
    callback: ({ user }) => {
      user.data.keys += 1;
    },
  },
  {
    weight: 20,
    key: "relics",
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

        const relicKey = BossRelics.collection
          .filter(
            (relic) =>
              BossRelics.isUserHasRelic({ userData, relic }) && relic.inPull,
          )
          .randomKey();

        relicKey && user.data.bossRelics.push(relicKey);
      }
    },
    filter: ({ boss, userStats }) => {
      return BossManager.isElite(boss) && !userStats.relicIsTaked;
    },
  },
  {
    weight: 70,
    key: "leaderRoar",
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
      embed.description += `\n\nДождались.., — наносит ${baseDamage} базового урона от источника ${damageTypeLabel(
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
  {
    weight: 100,
    key: "refrigerator",
    description: "Стужа",
    callback(content) {
      content.attackContext.damageMultiplayer = 0;
    },
    filter: ({ boss }) => BossSpecial.isSnowQueen(boss),
  },
  {
    weight: 100,
    key: "preventPositiveEffects",
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
  {
    weight: 100,
    key: "forging",
    repeats: true,
    description: "Эффект легендарного оружия усилен, обычный урон ослаблен",
    callback: async (context) => {
      const { user, boss, channel } = context;
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

  {
    weight: 0,
    key: "seemed",
    description: "Требуется совершить выбор",
    callback: async ({ user, channel }) => {
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
  {
    weight: 5,
    key: "andWhoStronger",
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
      const { mostStrongUser, usersStatsEntries } = context;
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
      const { user, channel } = context;
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
    filter({ boss, userStats }) {
      return (
        boss.level >= 3 &&
        Object.keys(boss.users).length > 2 &&
        this.EFFECT_ID in userStats === false
      );
    },
  },
  {
    weight: 200,
    key: "baseOfPercentage",
    description: "Базовый урон равен 0.007% от масимального здоровья босса",
    callback: async ({ attackContext, boss }) => {
      attackContext.baseDamage = Math.ceil(
        current_health_thresholder(boss) * 0.00007,
      );
    },
    filter: ({ boss }) => boss.level >= 10 && boss.level <= 30,
  },
  {
    weight: 100,
    repeats: true,
    key: "periodOfPlenty",
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
]);
