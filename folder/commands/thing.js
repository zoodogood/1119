import { BaseCommand } from "#lib/BaseCommand.js";
import * as Util from "#lib/util.js";
import CurseManager from "#lib/modules/CurseManager.js";
import DataManager from "#lib/modules/DataManager.js";
import TimeEventsManager from "#lib/modules/TimeEventsManager.js";
import { Actions } from "#lib/modules/ActionManager.js";
import { Collection } from "@discordjs/collection";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import EventsManager from "#lib/modules/EventsManager.js";

const { addResource } = Util;

const Elements = new Collection(
  Object.entries({
    earth: {
      key: "earth",
      color: "#34cc49",
      emoji: "🍃",
      name: "Земля",
      label: "Создает нечто из ничего",
      description:
        "Стабильность — медленно, но верно доведёт вас до вершин. Большой шанс получить ключи, коины, перцы и т.д., без рисков на неудачу.",
      index: 0,
      incomeCoefficient: 1,
    },
    wind: {
      key: "wind",
      color: "#a3ecf1",
      emoji: "☁️",
      name: "Воздух",
      label: "В естественном потоке меняет одно другим",
      description:
        "Никогда не знаешь что произойдет — скучно не будет.\nВозможно, вы получите большую сумму коинов, а на следующий день потеряете пару клубник.",
      index: 1,
      incomeCoefficient: 1.7,
    },
    fire: {
      key: "fire",
      color: "#dd6400",
      emoji: "🔥",
      name: "Огонь",
      label: "Берёт старое и награждает новым",
      description:
        "Его отличительной чертой является стабильная многаждая вероятность навсегда увеличить награду коин-сообщения, которая никогда не сгасает.",
      index: 2,
      incomeCoefficient: 0.8,
    },
    darkness: {
      key: "darkness",
      color: "#411f71",
      emoji: "👾",
      name: "Тьма",
      label: "Не оставляет ничего существующего",
      description:
        "Вы поступаете правильно, выбирая эту стихию, и в последствии получите свою честную нестабильность..",
      index: 3,
      incomeCoefficient: 0.2,
    },
  }),
);
const elementsEnum = Object.fromEntries(
  [...Elements.entries()].map(([key, { index }]) => [key, index]),
);

class Command extends BaseCommand {
  static Elements = Elements;

  static EVENTS_LIST = [
    {
      id: "day",
      _weight: 80,
      description: () =>
        [
          "Обычный день..",
          `${Util.random(1) ? "Обычный" : "Будний"} ${
            ["Зимний", "Весенний", "Летний", "Осенний"][
              Math.floor((new Date().getMonth() + 1) / 3) % 4
            ]
          } день...`,
          "Ничего не происходит.",
          "Происходит самое скучное событие — ничего не происходит",
        ].random(),
      variability: [
        [
          {
            action: async ({ scene }) => {
              scene.phrase =
                "Вы спокойно " +
                [
                  "работаете в своё удовольствие..",
                  "занимаетесь своим огородом..",
                ].random();
            },
            textOutput: "{scene.phrase}",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async (context) => {
              const { userData, scene, user } = context;

              if (userData.chilli && !Util.random(5)) {
                const sellingCount =
                  Math.min(userData.chilli, 3 + userData.elementLevel) ?? 0;
                const price = Util.random(
                  sellingCount * 160,
                  sellingCount * 190,
                );
                addResource({
                  user,
                  value: price,
                  executor: user,
                  source: "command.thing.event.day.wind.0",
                  resource: PropertiesEnum.coins,
                  context,
                });
                addResource({
                  user,
                  value: -sellingCount,
                  executor: user,
                  source: "command.thing.event.day.wind.0",
                  resource: PropertiesEnum.chilli,
                  context,
                });

                scene.phrase = `Вы смогли продать ${Util.ending(
                  sellingCount,
                  "пер",
                  "цев",
                  "ец",
                  "ца",
                )} и заработали ${price} <:coin:637533074879414272>`;
                return;
              }

              scene.phrase =
                "Вы весело " +
                [
                  "проводите время",
                  "отдыхаете",
                  "занимаетесь своим хобби",
                  "играете в салки с воришками",
                ].random();
            },
            textOutput: "{scene.phrase}",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async ({ scene }) => {
              scene.phrase =
                "Вы разумно вложили своё время" +
                [
                  " в восстановление сил.",
                  ", тренеруясь в скрытности.",
                  ", посещая храм",
                ].random();
            },
            textOutput: "{scene.phrase}",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async ({ scene }) => {
              scene.phrase =
                "Вы тратите это время на " +
                [
                  "чтение интересных книг.",
                  "развитие нового средства передвижения",
                  "общение с приятелями",
                  "отдых от злых дел",
                  "сотворение невежества",
                ].random();
            },
            textOutput: "{scene.phrase}",
          },
          false,
          false,
          false,
          false,
        ],
      ],
    },
    {
      id: "bossDamage",
      _weight: 40,
      description: () =>
        [
          "Вы видите босса",
          "Босс Вас приветствует",
          "Посмотрите туда, там Босс",
        ].random(),
      variability: [
        [
          {
            action: async () => {},
            textOutput: "{scene.phrase}",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async () => {},
            textOutput: "{scene.phrase}",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async () => {},
            textOutput: "{scene.phrase}",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async () => {},
            textOutput: "{scene.phrase}",
          },
          false,
          false,
          false,
          false,
        ],
      ],
      filter: ({ guild }) => this.boss.isAvailable(guild),
      onInit: ({ guild, elementBase, user, scene }) => {
        const bossElement = guild.data.boss.elementType;
        const damageDealt = this.boss.makeDamage(guild, user, {
          elementType: elementBase.index,
        });
        const isSame = bossElement === elementBase.index;

        const contents = {
          dealt: `Нанесено урона по боссу ${damageDealt} ед.`,
          multiplayer: isSame
            ? `, под эффектом Х${this.boss.ELEMENT_DAMAGE_MULTIPLAYER}`
            : "",
        };

        scene.phrase = `${contents.dealt}${contents.multiplayer}`;
      },
    },
    {
      id: "weekdays",
      _weight: 20,
      description: "Во время прогулки в лесу на вас напал одинокий разбойник",
      variability: [
        [
          {
            action: async () => false,
            textOutput: "Вы с друзьями смогли отбиться и даже не поранились!",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async (context) => {
              const { user } = context;
              addResource({
                user,
                value: -2,
                executor: user,
                source: "command.thing.event.weekdays.wind.0",
                resource: PropertiesEnum.coins,
                context,
              });
            },
            textOutput:
              "Мы бы сказали, что у вас отжали коины, но это не так, вы сами дали ему 2 монетки <:coin:637533074879414272>",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async (context) => {
              const { user } = context;
              addResource({
                user,
                value: 2,
                executor: user,
                source: "command.thing.event.weekdays.fire.0",
                resource: PropertiesEnum.coins,
                context,
              });
            },
            textOutput:
              "Вы вытрялси из него два коина <:coin:637533074879414272> и отпустили.",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async (context) => {
              const { user } = context;
              addResource({
                user,
                value: -2,
                executor: user,
                source: "command.thing.event.weekdays.void.0",
                resource: PropertiesEnum.coins,
                context,
              });
            },
            textOutput:
              "Он был вооружён, а вы — нет. Разумеется у вас отжали 2 коина.",
          },
          false,
          false,
          false,
          false,
        ],
      ],
      filter: ({ level }) => level < 2,
    },
    {
      id: "huckster",
      _weight: 30,
      description: "Вам встретился очень настойчивый торговец",
      variability: [
        [
          {
            action: async () => false,
            textOutput: "Вас не смогли заинтересовать его товары",
          },
          false,
          false,
          false,
          {
            action: async () => false,
            textOutput:
              "Мягко говоря, выглядел он не живым уже как пять минут\nВы истратили все свои силы, чтобы спасти барыгу, но даже сейчас не приняли денег в качестве благодарности.",
          },
        ],
        [
          {
            action: async (context) => {
              const { user } = context;
              addResource({
                user,
                value: -120,
                executor: user,
                source: "command.thing.event.hukster.wind.0",
                resource: PropertiesEnum.coins,
                context,
              });
              addResource({
                user,
                value: 1,
                executor: user,
                source: "command.thing.event.hukster.wind.0",
                resource: PropertiesEnum.keys,
                context,
              });
            },
            textOutput: "Вы купили у него ключ всего за 120 коинов!",
          },
          {
            action: async (context) => {
              const { user } = context;
              addResource({
                user,
                value: 2,
                executor: user,
                source: "command.thing.event.hukster.wind.1",
                resource: PropertiesEnum.keys,
                context,
              });
              addResource({
                user,
                value: -210,
                executor: user,
                source: "command.thing.event.hukster.wind.1",
                resource: PropertiesEnum.coins,
                context,
              });
            },
            textOutput: "Вы купили у него два ключа всего за 210 коинов!",
          },
          {
            action: async (context) => {
              const { user } = context;
              addResource({
                user,
                value: 4,
                executor: user,
                source: "command.thing.event.hukster.wind.2",
                resource: PropertiesEnum.keys,
                context,
              });

              addResource({
                user,
                value: -400,
                executor: user,
                source: "command.thing.event.hukster.wind.2",
                resource: PropertiesEnum.coins,
                context,
              });
            },
            textOutput: "Вы купили у него 4 ключа всего за 400 коинов!",
          },
          {
            action: async (context) => {
              const { user } = context;
              addResource({
                user,
                value: 5,
                executor: user,
                source: "command.thing.event.hukster.wind.3",
                resource: PropertiesEnum.keys,
                context,
              });
              addResource({
                user,
                value: -490,
                executor: user,
                source: "command.thing.event.hukster.wind.3",
                resource: PropertiesEnum.coins,
                context,
              });
            },
            textOutput: "Вы купили у него 5 ключей всего за 490 коинов!",
          },
          {
            action: async (context) => {
              const { user } = context;
              addResource({
                user,
                value: 7,
                executor: user,
                source: "command.thing.event.hukster.wind.4",
                resource: PropertiesEnum.keys,
                context,
              });
              addResource({
                user,
                value: -630,
                executor: user,
                source: "command.thing.event.hukster.wind.4",
                resource: PropertiesEnum.coins,
                context,
              });
            },
            textOutput: "Вы купили у него 7 ключей всего за 630 коинов!",
          },
        ],
        [
          {
            action: async (context) => {
              const { user } = context;
              const keys = 1;
              const price = 220;
              const coinsBonus = 1;
              addResource({
                user,
                value: keys,
                executor: user,
                source: "command.thing.event.hukster.fire.0",
                resource: PropertiesEnum.keys,
                context,
              });
              addResource({
                user,
                value: -price,
                executor: user,
                source: "command.thing.event.hukster.fire.0",
                resource: PropertiesEnum.coins,
                context,
              });
              addResource({
                user,
                value: coinsBonus,
                executor: user,
                source: "command.thing.event.hukster.fire.0",
                resource: PropertiesEnum.coinsPerMessage,
                context,
              });
            },
            textOutput:
              "Вы купили у него перец и дали на чай\nВсего пришлось заплатить 220 коинов, но и этим очень порадовали старика.\nТеперь вы получаете на одну монету больше за каждое коин-сообщение",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async (context) => {
              const { level, scene, coefficient, user } = context;
              const value = (scene.coins = Math.floor(coefficient));
              let isWin = null;

              if (Util.random((level + 1) / 2)) {
                isWin = true;
                scene.phrase = `Считай, заработали ${Util.ending(
                  scene.coins,
                  "коин",
                  "ов",
                  "",
                  "а",
                )}`;
              } else {
                isWin = false;
                scene.phrase = `Однако, к вашему огромною удивлению дедуля отбил вашу атаку и справедливо отобрал ваши ${Util.ending(
                  scene.coins,
                  "коин",
                  "ов",
                  "",
                  "а",
                )}`;
              }
              addResource({
                user,
                value: (-1) ** !isWin * value,
                executor: user,
                source: "command.thing.event.hukster.void.0",
                resource: PropertiesEnum.coins,
                context,
              });
            },
            textOutput:
              "За дерзость вы нагло забрали его товар, который он держал прямо перед вашим лицом\n{scene.phrase}",
          },
          false,
          false,
          false,
          {
            action: async (context) => {
              const { scene, coefficient, user } = context;
              const value = (scene.coins = Math.floor(coefficient));
              addResource({
                user,
                value,
                executor: user,
                source: "command.thing.event.hukster.void.4",
                resource: PropertiesEnum.coins,
                context,
              });
            },
            textOutput:
              "За дерзость вы убили торговца, забрали его товар и наглумились, подзаработав эдак коинов {scene.coins}",
          },
        ],
      ],
    },
    {
      id: "berrys",
      _weight: 15,
      description: "Вы решили испытать магию на своей клубнике",
      variability: [
        [
          {
            action: async (context) => {
              const { user } = context;
              addResource({
                user,
                value: 1,
                executor: user,
                source: "command.thing.event.berrys.earth.0",
                resource: PropertiesEnum.berrys,
                context,
              });
            },
            textOutput:
              "И вам удалось её клонировать! Собственно, у вас на одну клубнику больше.",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async (context) => {
              const { user } = context;
              const isIncreased = Util.random(1);
              addResource({
                user,
                value: (-1) ** !isIncreased * 1,
                executor: user,
                source: "command.thing.event.berrys.wind.0",
                resource: PropertiesEnum.berrys,
                context,
              });
            },
            textOutput:
              "Она то-ли увеличилась, то-ли уменьшилась. Никто так и не понял..",
          },
          {
            action: async (context) => {
              const { user } = context;
              const isBerrysCountIncreased = Util.random(1);

              if (isBerrysCountIncreased)
                addResource({
                  user,
                  value: 1,
                  executor: user,
                  source: "command.thing.event.berrys.wind.1",
                  resource: PropertiesEnum.berrys,
                  context,
                });

              !isBerrysCountIncreased && DataManager.data.bot.berrysPrice++;
            },
            textOutput:
              "Она вроде увеличилась, а вроде увеличилась её цена. Никто так и не понял..",
          },
          false,
          false,
          {
            action: async (context) => {
              const value = Util.random(1) + 1;
              const { user } = context;
              addResource({
                user,
                value,
                executor: user,
                source: "command.thing.event.berrys.wind.4",
                resource: PropertiesEnum.coins,
                context,
              });
            },
            textOutput:
              "Она вроде увеличилась, а вроде ещё раз увеличилась. Вдвойне выгодно.",
          },
        ],
        [
          {
            action: async (context) => {
              const { level, user } = context;
              const addingCoinsPerMessage = 2 + level;
              addResource({
                user,
                value: -1,
                executor: user,
                source: "command.thing.event.berrys.fire.0",
                resource: PropertiesEnum.berrys,
                context,
              });

              addResource({
                user,
                value: addingCoinsPerMessage,
                executor: user,
                source: "command.thing.event.berrys.fire.0",
                resource: PropertiesEnum.coinsPerMessage,
                context,
              });
            },
            textOutput:
              "Поглотили её силу и сразу увеличили награду коин-сообщений на {2 + context.level} ед.\nК слову, клубника была действительно вкусной.",
          },
          false,
          false,
          {
            action: async (context) => {
              const { userData, user, scene } = context;
              const berrys = Math.min(userData.berrys, 10);
              const bonuses = Math.ceil(berrys * Util.random(1.2, 1.4));
              addResource({
                user,
                value: -berrys,
                executor: user,
                source: "command.thing.event.berrys.wind.3",
                resource: PropertiesEnum.berrys,
                context,
              });
              addResource({
                user,
                value: bonuses,
                executor: user,
                source: "command.thing.event.berrys.wind.3",
                resource: PropertiesEnum.chestBonus,
                context,
              });

              scene.bonuses = bonuses;
            },
            textOutput:
              '"Сыворотка для преобразования клубники в волшебные сундуки", так вы назвали свой раствор, превратив часть своей клубники в {Util.ending(scene.bonuses, "бонус", "ов", "", "а")} сундука',
          },
          false,
        ],
        [
          {
            action: async (context) => {
              const { user } = context;
              addResource({
                user,
                value: -2,
                executor: user,
                source: "command.thing.event.berrys.void.0",
                resource: PropertiesEnum.berrys,
                context,
              });
            },
            textOutput:
              "В ходе экспериментов две из двух клубник превратились в прах.",
          },
          false,
          false,
          {
            action: async (context) => {
              const { user } = context;
              addResource({
                user,
                value: -2,
                executor: user,
                source: "command.thing.event.berrys.void.3",
                resource: PropertiesEnum.berrys,
                context,
              });
              addResource({
                user,
                value: 6,
                executor: user,
                source: "command.thing.event.berrys.void.3",
                resource: PropertiesEnum.coinsPerMessage,
                context,
              });
            },
            textOutput:
              "В ходе экспериментов вам удалось их оживить, увеличив заработок коин-сообщений на 6 единиц",
          },
          false,
        ],
      ],
      filter: ({ userData }) => userData.berrys > 2,
    },
    {
      id: "unrealCreatures",
      _weight: ({ level }) => 1 + Math.floor(level / 2),
      description: "Этой ночью ваши силы особо насищенны..",
      variability: [
        [
          {
            action: async ({ scene }) => {
              scene.random = Util.random(3, 8);
              DataManager.data.bot.berrysPrice += scene.random;
            },
            textOutput:
              'Эту возможность вы решили использовать, чтобы помочь другим..\nВся клубника продается на {Util.ending(scene.random, "коин", "ов", "", "а")} дороже.',
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async (context) => {
              const isWin = Util.random(0);
              const { scene, user } = context;
              addResource({
                user,
                value: isWin ? 3000 : -1000,
                executor: user,
                source: "command.thing.event.unrealCreatures.wind.0",
                resource: PropertiesEnum.coins,
                context,
              });

              scene.phrase = isWin
                ? "Удача! Вы выиграли 3000 <:coin:637533074879414272> !"
                : "Не повезло, вы проиграли 1000 коинов <:coin:637533074879414272>";
            },
            textOutput:
              "Используя свои способности вы намеренны выиграть Джекпот..\n{scene.phrase}",
          },
          false,
          false,
          false,
          {
            action: async (context) => {
              const { scene, user } = context;
              const value = 500 * Util.random(2, 15);
              addResource({
                user,
                value,
                executor: user,
                source: "command.thing.event.unrealCreatures.wind.4",
                resource: PropertiesEnum.coins,
                context,
              });
              scene.coins = value;
            },
            textOutput:
              "Повысив удачу, вы построили парк развлечений и заработали {scene.coins} <:coin:637533074879414272>",
          },
        ],
        [
          {
            action: async (context) => {
              const { user, userData } = context;
              addResource({
                user,
                value: Math.ceil((userData.coinsPerMessage ?? 0) * 0.02),
                executor: user,
                source: "command.thing.event.unrealCreatures.fire.0",
                resource: PropertiesEnum.coinsPerMessage,
                context,
              });
            },
            textOutput:
              "Укрепили силу духа, на том и закончили. Бонус коинов за сообщения увеличен на 2%",
          },
          false,
          false,
          false,
          {
            action: async () => true,
            textOutput:
              "Долго же вы ждали этого момента...\nЭтот день — отличная возможность наведаться в межмировую потасовку..",
          },
        ],
        [
          {
            action: async (context) => {
              const { user } = context;
              addResource({
                user,
                value: -Util.random(1, 2),
                executor: user,
                source: "command.thing.event.unrealCreatures.void.0",
                resource: PropertiesEnum.level,
                context,
              });

              addResource({
                user,
                value: 1,
                executor: user,
                source: "command.thing.event.unrealCreatures.void.0",
                resource: PropertiesEnum.void,
                context,
              });
            },
            textOutput:
              "Вы породили кусок нестабильности <a:void:768047066890895360>, но потеряли много опыта и крошечку рассудка.",
          },
          false,
          {
            action: async (context) => {
              const { user, scene } = context;
              const voidCount = (scene.voids = Util.random(1, 2));
              addResource({
                user,
                value: -5,
                executor: user,
                source: "command.thing.event.unrealCreatures.void.2",
                resource: PropertiesEnum.keys,
                context,
              });
              addResource({
                user,
                value: -1,
                executor: user,
                source: "command.thing.event.unrealCreatures.void.2",
                resource: PropertiesEnum.berrys,
                context,
              });
              addResource({
                user,
                value: -Util.random(300, 1400),
                executor: user,
                source: "command.thing.event.unrealCreatures.void.2",
                resource: PropertiesEnum.coins,
                context,
              });
              addResource({
                user,
                value: voidCount,
                executor: user,
                source: "command.thing.event.unrealCreatures.void.2",
                resource: PropertiesEnum.void,
                context,
              });
            },
            textOutput:
              'Преобразуя материальные предметы вы получаете {Util.ending(scene.voids, "уровн", "ей", "ь", "я")} нестабильности <a:void:768047066890895360>\nЦеной такого ритуала стали 5 обычных старых ключей, клубника и немного прекрасного — денег.',
          },
          false,
          {
            action: async (context) => {
              const { user } = context;
              addResource({
                user,
                value: 2,
                executor: user,
                source: "command.thing.event.unrealCreatures.void.4",
                resource: PropertiesEnum.void,
                context,
              });
            },
            textOutput:
              "Что может быть лучше, чем два камня нестабильности добытых из сердец слуг.. <a:void:768047066890895360>",
          },
        ],
      ],
    },
    {
      id: "fireMonkey",
      _weight: 15,
      description: "Огненная обезьяна утащила стопку ваших ключей!",
      onInit: (context) => {
        const { user, scene } = context;
        scene.stolenKeys = Util.random(3, 7);
        addResource({
          user,
          value: -scene.stolenKeys,
          executor: user,
          source: "command.thing.event.fireMonkey.general",
          resource: PropertiesEnum.keys,
          context,
        });
      },
      variability: [
        [
          {
            action: async () => false,
            textOutput: "Ваши попытки договорится не помогли..",
          },
          {
            action: async (context) => {
              const { user, scene } = context;
              addResource({
                user,
                value: scene.stolenKeys,
                executor: user,
                source: "command.thing.event.fireMonkey.earth.1",
                resource: PropertiesEnum.keys,
                context,
              });
            },
            textOutput:
              "Совместно вы убедили товарища обезьяну вернуть ваши ключи",
          },
          false,
          false,
          false,
        ],
        [
          {
            action: async () => false,
            textOutput: "Тактика догнать и вернуть оказалась провальной...",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async (context) => {
              const { user, scene } = context;
              scene.random = Util.random(15, 45);
              const value = scene.stolenKeys * scene.random;
              addResource({
                user,
                value,
                executor: user,
                source: "command.thing.event.fireMonkey.fire.0",
                resource: PropertiesEnum.keys,
                context,
              });
            },
            textOutput:
              "Вам удалось договорится — обезьяна взамен ключей дала вам {scene.stolenKeys * scene.random} <:coin:637533074879414272>",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async (context) => {
              const { user } = context;
              if (user.data.berrys)
                addResource({
                  user,
                  value: -1,
                  executor: user,
                  source: "command.thing.event.fireMonkey.void.0",
                  resource: PropertiesEnum.berrys,
                  context,
                });
            },
            textOutput:
              'Сражаться с обезьяной и угрожать ей было плохой идеей{context.user.berrys ? ", вы потеряли ещё и пару клубник (1)" : "..."}',
          },
          false,
          false,
          false,
          false,
        ],
      ],
      filter: ({ userData, level }) => level > 1 && userData.keys > 30,
    },
    {
      id: "clover",
      _weight: 15,
      description:
        "Вам повезло оказатся рядом с великим Клевером, приносящим удачу и богатсва",
      variability: [
        [
          {
            action: async ({ level, channel }) => {
              const clover = channel.guild.data.cloverEffect;
              const day = TimeEventsManager.Util.timestampDay(clover.timestamp);

              const filter = ({ name, _params_as_json }) =>
                name === "clover-end" &&
                _params_as_json.includes(channel.guild.id);

              const event = TimeEventsManager.at(day).find(filter);
              TimeEventsManager.update(event, {
                timestamp: clover.timestamp + level * 1_200_000,
              });
            },
            textOutput:
              "Вы благословили клевер, чем продлили ему жизнь на {context.level * 20} минут",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async (context) => {
              const { user, channel } = context;
              (async () => {
                const cloverMessage = await channel.awaitMessage({
                  user: false,
                });
                let reaction;
                let i = 0;
                while ((!reaction || !reaction.me) && i < 100) {
                  reaction = cloverMessage.reactions.cache.get("☘️");
                  i++;
                  await Util.sleep(100);
                }

                if (reaction && reaction.me) {
                  await Util.sleep(2000);
                  const author = cloverMessage.author;
                  addResource({
                    user: author,
                    value: 1,
                    executor: user,
                    source: "command.thing.event.clover.wind.0",
                    resource: PropertiesEnum.void,
                    context,
                  });
                  cloverMessage.msg({
                    title: "Нестабилити!",
                    author: {
                      name: author.username,
                      iconURL: author.avatarURL(),
                    },
                    description: `**${author.username}!!!1!!!!111111!11111!!!!** Вот это да! Магияей клевера вы превратили небольшую горстку монет в камень нестабильности <a:void:768047066890895360>\nПо информации из математических источников это удавалось всего-лишь единицам из тысяч и вы теперь входите в их число!`,
                    reactions: ["806176512159252512"],
                  });
                  author.action(Actions.globalQuest, {
                    name: "cloverInstability",
                  });
                }
              })();
            },
            textOutput:
              "С помощью вашей магии клевер стал сильнее. Если следующее сообщение в этом канале будет с коином, его автор получит нестабильность!",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async (context) => {
              const { user, scene } = context;
              scene.coins = Util.random(10, 30);
              addResource({
                user,
                value: scene.coins,
                executor: user,
                source: "command.thing.event.clover.fire.0",
                resource: PropertiesEnum.coins,
                context,
              });
            },
            textOutput:
              "Разумеется, вы не могли упустить такого момента, и заработали {scene.coins} мелочи",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async ({ channel }) => {
              const clover = channel.guild.data.cloverEffect;
              const day = TimeEventsManager.Util.timestampDay(clover.timestamp);
              const filter = ({ name, params }) =>
                name === "clover-end" && params.includes(channel.guild.id);

              const event = TimeEventsManager.at(day).find(filter);
              TimeEventsManager.update(event, {
                timestamp: clover.timestamp / 2,
              });
            },
            textOutput:
              "Похитили его ради своих нужд, клевер начал погибать, в попытках исправить свою ошибку вернули клевер на его место и дали немного воды... Действие эффекта уменьшено вдвое.",
          },
          false,
          {
            action: async () => false,
            textOutput: "Дали клеверу немного воды",
          },
          false,
          false,
        ],
      ],
      filter: ({ level, channel }) =>
        "cloverEffect" in channel.guild.data && level > 2,
    },
    {
      id: "school",
      _weight: 5,
      description: "Тихим учебным днём...",
      variability: [
        [
          {
            action: async (context) => {
              const { user } = context;
              addResource({
                user,
                value: 1,
                executor: user,
                source: "command.thing.event.school.earth.0",
                resource: PropertiesEnum.berrys,
                context,
              });
              DataManager.data.bot.berrysPrice += 3;
            },
            textOutput:
              "Труд-труд и ещё раз труд.. За усердную работу вы получили одну клубнику, а их цена на рынке поднялась на 3ед.",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async (context) => {
              const { user } = context;
              addResource({
                user,
                value: 2,
                executor: user,
                source: "command.thing.event.school.wind.0",
                resource: PropertiesEnum.coins,
                context,
              });
            },
            textOutput:
              "Школа.. Вспоминать о ней довольно грустно.\nСегодня ваше настроение было не очень весёлым",
          },
          false,
          false,
          {
            action: async (context) => {
              const { user, channel } = context;
              addResource({
                user,
                value: -16_000,
                executor: user,
                source: "command.thing.event.school.wind.3",
                resource: PropertiesEnum.coins,
                context,
              });

              const counter = 0;
              const filter = (message) => message.author.id === user.id;
              const collector = new Util.CustomCollector({
                target: channel.client,
                event: "message",
                filter,
                time: 600_000,
              });
              collector.setCallback((message) => {
                if (counter >= 15) {
                  collector.end();
                }
                EventsManager.emitter.emit("users/getCoinsFromMessage", {
                  user,
                  message,
                });
              });
            },
            textOutput: "Вы передали 16 000 коинов на ремонтные работы",
          },
          false,
        ],
        [
          {
            action: async (context) => {
              const { user, scene } = context;
              scene.random = Util.random(1, 3);
              addResource({
                user,
                value: scene.random,
                executor: user,
                source: "command.thing.event.school.fire.0",
                resource: PropertiesEnum.chestBonus,
                context,
              });
            },
            textOutput:
              "Сундук знаний пополнился — Получено бонус сундука Х{scene.random}",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async (context) => {
              const { user } = context;
              addResource({
                user,
                value: -2,
                executor: user,
                source: "command.thing.event.school.void.0",
                resource: PropertiesEnum.coins,
                context,
              });
            },
            textOutput: "Вы с интересом изучали Астрономию.",
          },
          false,
          false,
          false,
          {
            action: async (context) => {
              const { user } = context;
              addResource({
                user,
                value: 782,
                executor: user,
                source: "command.thing.event.clover.void.4",
                resource: PropertiesEnum.keys,
                context,
              });
            },
            textOutput:
              "Вы преподаете студентам курс высшей Астраномии.\nНеплохое занятие для того, кто хочет разрушить мир. Сегодня вы заработали 782 коина <:coin:637533074879414272>",
          },
        ],
      ],
    },
    {
      id: "aBeautifulFox",
      _weight: 7,
      description: "Вы встретили прекрасного лиса",
      onInit(context) {
        const { user } = context;
        addResource({
          user,
          value: 5,
          executor: user,
          source: "command.thing.event.aBeautifulFox.general",
          resource: PropertiesEnum.chestBonus,
          context,
        });
      },
      variability: [
        [
          {
            action: async () => true,
            textOutput: "Он одарил Вас сокровищем: 5 бонусов сундука получено",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async () => true,
            textOutput: "Он одарил Вас сокровищем: 5 бонусов сундука получено",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async () => true,
            textOutput: "Он одарил Вас сокровищем: 5 бонусов сундука получено",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async () => true,
            textOutput: "Он одарил Вас сокровищем: 5 бонусов сундука получено",
          },
          false,
          false,
          false,
          false,
        ],
      ],
    },
    {
      id: "curseOfWealth",
      _weight: 40,
      description:
        "Наверное, это инфляция. Вы не в состоянии уследить за своим богатсвом.",
      onInit(context) {
        const { user, userData } = context;
        addResource({
          user,
          value: -Math.floor(userData.coins),
          executor: user,
          source: "command.thing.event.curseOfWealth.earth.0",
          resource: PropertiesEnum.coins,
          context,
        });
      },
      variability: [
        [
          {
            action: async () => true,
            textOutput:
              "Даже среди ваших верных друзей нашлись предатели: 2% золота было похищено.",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async () => true,
            textOutput:
              "Ваши богатсва обдирают прямо у вас на глазах. Вы слишком добры, чтобы их останавливать.",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async () => true,
            textOutput:
              "Вам удается вернуть лишь часть богатсв. Ещё 2% вы таки потеряли.",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async () => true,
            textOutput: "Вам ведь нет дела до каких-то монеток.",
          },
          false,
          false,
          false,
          false,
        ],
      ],
      filter: ({ userData }) => userData.coins > 100_000_000,
    },
    {
      id: "thingNotFound",
      _weight: ({ userData }) =>
        5 + (Math.sqrt(userData.voidRituals / 2) * 5 ?? 0),
      description: "Штука Вам больше не отвечает.",
      variability: [
        [
          {
            action: async ({ scene }) =>
              (scene.phrase = [
                "Вы ничего не можете с этим поделать",
                "Не взирая на Вашу силу, это так",
              ].random()),
            textOutput: "{scene.phrase}",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async ({ scene }) =>
              (scene.phrase = [
                "Штука просто штука.",
                "Штуке тоже нужен отдых",
              ].random()),
            textOutput: "{sceme.phrase}",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async ({ scene }) =>
              (scene.phrase = [
                "Вы слишком сильны дня неё",
                "Ваша мощь куда больше силы штуки",
                "Так даже лучше",
              ].random()),
            textOutput: "{scene.phrase}",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async ({ scene }) =>
              (scene.phrase = [
                "Что вам от неё нужно?!",
                "Штука была вашим другом",
              ].random()),
            textOutput: "{scene.phrase}",
          },
          false,
          false,
          false,
          false,
        ],
      ],
      filter: ({ userData }) => userData.voidRituals > 100,
    },
    {
      id: "letsMourn",
      _weight: 3,
      description: "О Вас ходят разные слухи",
      variability: [
        [
          {
            action: async ({ scene }) =>
              (scene.phrase = [
                "Говорят, вы никакущий фермер",
                "Поговаривают, что вы сами непонимаете для чего работаете",
              ].random()),
            textOutput: "{scene.phrase}",
          },
          false,
          {
            action: async ({ scene }) =>
              (scene.phrase = [
                "Они хотят, чтобы вы рассказали побольше о своём деле",
                "Всех интересует вопрос: как..?",
              ].random()),
            textOutput: "{scene.phrase}",
          },
          {
            action: async ({ scene }) =>
              (scene.phrase = [
                "Люди думают, вы продали душу ради урожая",
                "Якобы вы добились всего нечестным путём",
              ].random()),
            textOutput: "{scene.phrase}",
          },
          false,
        ],
        [
          {
            action: async ({ scene }) =>
              (scene.phrase = [
                "Говорят, вы абсолютно легкомысленны",
                "Поговаривают, что за свою жизнь вы побывали в самых разных абсурдных ситуациях",
              ].random()),
            textOutput: "{scene.phrase}",
          },
          false,
          {
            action: async ({ scene }) =>
              (scene.phrase = [
                "Они хотят, чтобы вы рассказали как оно, быть удачливым",
                "Всех интересует вопрос: как..?",
              ].random()),
            textOutput: "{scene.phrase}",
          },
          {
            action: async ({ scene }) =>
              (scene.phrase = [
                "Люди думают, что вы крадете их удачу",
                "Якобы вы добились всего нечестным путём",
              ].random()),
            textOutput: "{scene.phrase}",
          },
          false,
        ],
        [
          {
            action: async ({ scene }) =>
              (scene.phrase = [
                "Говорят, вы странный",
                "Поговаривают самые разные мифы",
              ].random()),
            textOutput: "{scene.phrase}",
          },
          false,
          {
            action: async ({ scene }) =>
              (scene.phrase = [
                "Они хотят, чтобы вы научили их медитации",
                "Всех интересует вопрос: как..?",
              ].random()),
            textOutput: "{scene.phrase}",
          },
          {
            action: async ({ scene }) =>
              (scene.phrase = [
                "Люди думают, что у вас вообще нет эмоций",
                "Якобы вы избавите этот мир от зла",
              ].random()),
            textOutput: "{scene.phrase}",
          },
          false,
        ],
        [
          {
            action: async ({ scene }) =>
              (scene.phrase = [
                "Говорят самые гадкие вещи про вас",
                "Поговаривают, что в вас нет ничего святого",
              ].random()),
            textOutput: "{scene.phrase}",
          },
          false,
          {
            action: async ({ scene }) =>
              (scene.phrase = [
                "Они хотят той же мощи, что и у ваас",
                "Всех интересует вопрос: когда найдется тот, кто даст вам по башке?",
              ].random()),
            textOutput: "{scene.phrase}",
          },
          {
            action: async ({ scene }) =>
              (scene.phrase = [
                "Люди думают, что вы их не убиваете только, чтобы творить более ужасные вещи",
                "Якобы вам никогда нельзя смотреть в глаза",
              ].random()),
            textOutput: "{scene.phrase}",
          },
          false,
        ],
      ],
    },
    {
      id: "curse",
      _weight: 10,
      description: "Из-за того, что вы прокляты, к вам пристала старушка",
      variability: [
        [
          {
            action: async (context) => {
              const { level, user } = context;
              addResource({
                user,
                value: (level + 1) * 300,
                executor: user,
                source: "command.thing.event.curse.earth.0",
                resource: PropertiesEnum.coins,
                context,
              });
            },
            textOutput:
              "— Не рискуйте так, молодой человек. Говорит она Вам. (Несколько монет получено)",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async (context) => {
              const { level, user } = context;
              addResource({
                user,
                value: (level + 1) * 300,
                executor: user,
                source: "command.thing.event.curse.wind.0",
                resource: PropertiesEnum.keys,
                context,
              });
            },
            textOutput:
              "— Рискуете то там, то сям, я вас понимаю. Возьмите это на всякий случай, зайдете лавку, а там приоберетете шубу от напастей. (Вы получили немного коинов)",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async (context) => {
              const { level, user } = context;
              addResource({
                user,
                value: (level + 1) * 300,
                executor: user,
                source: "command.thing.event.curse.fire.0",
                resource: PropertiesEnum.keys,
                context,
              });
            },
            textOutput:
              "— Угораздило же тебя пойти на такое, вот, возьми. Старушка в помощь дала вам немного монет",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async (context) => {
              const { user } = context;
              const curse = user.curses.at(0);
              CurseManager.interface({ curse, user }).incrementProgress(1);
              CurseManager.checkAvailable({ user, curse });
            },
            textOutput: "— Я помогу тебе избавиться от твоего проклятия...",
          },
          false,
          false,
          false,
          false,
        ],
      ],
      filter: ({ userData }) => userData.curses?.length,
    },
    {
      id: "starsInWindow",
      _weight: 2,
      description:
        "Когда звёзды встанут в ряд, ты прими это как знак, что всё будет в порядке...",
      onInit(context) {
        const { user } = context;
        addResource({
          user,
          value: 30,
          executor: user,
          source: "command.thing.event.starsInWindow.general",
          resource: PropertiesEnum.chestBonus,
          context,
        });
      },
      variability: [
        [
          {
            action: async () => true,
            textOutput: "30 бонусов сундука получено",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async () => true,
            textOutput: "30 бонусов сундука получено",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async () => true,
            textOutput: "30 бонусов сундука получено",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async () => true,
            textOutput: "30 бонусов сундука получено",
          },
          false,
          false,
          false,
          false,
        ],
      ],
    },
    {
      id: "peoplesBecomeARich",
      _weight: 100,
      description:
        "На улице фантастические цены на клубнику\nЛюди продают её пока могут и обретают богатсва.",
      variability: [
        [
          {
            action: async () => {
              DataManager.data.bot.berrysPrice -= 125;
            },
            textOutput: "За последние 2с цена клубники упала на 125ед.",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async ({ scene }) => {
              const value =
                Util.random(55, 110) + DataManager.data.bot.berrysPrice / 10;
              DataManager.data.bot.berrysPrice -= value;
              scene.value = value;
            },
            textOutput:
              "За последние 2с цена клубники упала на { scene.value }ед.",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async () => {
              DataManager.data.bot.berrysPrice -= 50;
            },
            textOutput: "За последние 2с цена клубники упала на 50ед.",
          },
          false,
          false,
          false,
          false,
        ],
        [
          {
            action: async (context) => {
              DataManager.data.bot.berrysPrice -= 50;
              const { user, userData } = context;
              addResource({
                user,
                value: -Math.min(userData.berrys, 5),
                executor: user,
                source: "command.thing.event.peoplesBecomeARich.void.0",
                resource: PropertiesEnum.keys,
                context,
              });
            },
            textOutput:
              "За последние 2с цена клубники упала на 50ед.\nУ вас отбирают клубнику",
          },
          false,
          false,
          false,
          {
            action: async () => {
              DataManager.data.bot.berrysPrice -= 200;
            },
            textOutput: "Вы снизили её цену на 200ед.",
          },
        ],
      ],
      filter: () => DataManager.data.bot.berrysPrice >= 900,
    },
  ];

  static BASIC_COINS_COEFFICIENT = 20;

  async run({ user, elementBase, channel, level, interaction }) {
    const guild = channel.guild;
    const userData = user.data;

    const coefficient = Util.random(this.constructor.BASIC_COINS_COEFFICIENT, {
      round: false,
    });
    const scene = {};
    const context = {
      user,
      elementBase,
      channel,
      scene,
      level,
      guild,
      userData,
      coefficient,
      interaction,
    };

    const _transformWeightOf = (event) =>
      typeof event._weight === "function"
        ? { ...event, _weight: event._weight(context) }
        : event;
    const needSkip = (event) =>
      "filter" in event === false || event.filter(context);

    const eventBase = this.constructor.EVENTS_LIST.filter(needSkip)
      .map(_transformWeightOf)
      .random({ weights: true });

    const actionBase = eventBase.variability[elementBase.index]
      .filter((action, i) => i <= context.level && action)
      .random();

    eventBase.onInit && eventBase.onInit(context);

    await actionBase.action(context);
    const output = actionBase.textOutput.replace(/\{.+?\}/g, (raw) =>
      eval(raw.slice(1, -1)),
    );

    const income = Math.round(
        elementBase.incomeCoefficient *
          (context.level + 2.5) *
          (coefficient + 5),
      ),
      phrase = [
        "Это птица? Это самолёт! Нет, это штука!",
        "Вдумайтесь..",
        "Ученье – свет, а неученье – штука.",
        "Игрушка!",
        "Случайности случайны.",
        "**ШТУКОВИНА**",
        "Используйте !штука я, чтобы поменять стихию",
        "Используйте !штука улучшить, чтобы открыть новые события",
      ].random(),
      footerPhrase = [
        "кубик рубика",
        "сапог",
        "звёзду",
        "снеговика",
        "зайца",
        "большой город",
        "огненную обезьяну",
        "ананас",
        "кефир",
      ].random();

    const contents = {
      guildTakeCoins: `Вы помогли серверу — он получил ${Util.ending(
        income,
        "коин",
        "ов",
        "",
        "а",
      )}`,
      event:
        eventBase.id === "day"
          ? ""
          : "\nЗа это время также произошло интересное событие:",
      description:
        typeof eventBase.description === "function"
          ? eventBase.description(context)
          : eventBase.description,
    };

    channel.guild.data.coins += income;
    channel.msg({
      title: phrase,
      description: `${contents.guildTakeCoins}${contents.event}`,
      color: elementBase.color,
      author: { iconURL: user.avatarURL(), name: user.username },
      fields: [
        { name: "Если коротко..", value: `**${contents.description}**\n⠀` },
        {
          name: `${elementBase.emoji} ${context.level + 1} ур.`,
          value: output,
        },
      ],
      footer: {
        text: `Скажем так: эта вещь чем-то похожа на ${footerPhrase}..`,
      },
    });
  }

  getCooldownInfo() {
    const COOLDOWN = 10_800_000;
    const COOLDOWN_TRY = 2;
    const cooldownThresholder = Date.now() + COOLDOWN * (COOLDOWN_TRY - 1);

    return { COOLDOWN, COOLDOWN_TRY, cooldownThresholder };
  }

  displayUserInfo({ interaction, element }) {
    if (!element) {
      interaction.channel.msg({
        description: "Упомянутый пользователь пока не открыл штуку..",
      });
      return;
    }

    const username = interaction.mention.username;

    const color = element.color;
    const emoji = element.emoji;

    const mentionContent = [
      username.toUpperCase(),
      username.toLowerCase(),
      username.toLowerCase(),
    ].join("-");

    const { cooldownThresholder } = this.getCooldownInfo();
    const inCooldownContent = ["Нет.", "Да."][
      +(interaction.mention.data.CD_52 > cooldownThresholder)
    ];

    const description = `${mentionContent}...\nВыбранная стихия: ${emoji}\nУровень штуки: ${
      (interaction.mention.data.elementLevel || 0) + 1
    }\n\n${element.description}\nНа перезарядке: ${inCooldownContent}`;
    interaction.channel.msg({ description, color });
    return;
  }

  static MAX_LEVEL = 4;

  async displayThingIsClosed(interaction) {
    const description =
      "Вам ещё недоступна эта команда\nдля её открытия совершите хотя бы один ритуал, используя команду !котёл.\nВ будущем она будет генерировать коины для сервера, а также активировать случайные события.";
    interaction.channel.msg({
      title: "Штуке требуется немного магии котла,\nчтобы она могла работать.",
      description,
      delete: 22_000,
      reactions: ["763804850508136478"],
    });
    return;
  }

  async displayThingIsInCooldown({
    interaction,
    cooldownThresholder,
    elementBase,
  }) {
    const userData = interaction.user.data;

    const title = `${elementBase.emoji} Штука перезаряжается!`;
    const description = `Товарищ многоуважаемый, спешу сообщить, что:\nВаш персонаж слишком устал от приключений.\n\nПерерыв на обед ещё: ${Util.timestampToDate(
      userData.CD_52 - cooldownThresholder,
    )}`;

    interaction.channel.msg({ title, description, color: elementBase.color });
    return;
  }

  async displaySelectElementInterface(interaction) {
    const Elements = this.constructor.Elements;
    const userData = interaction.user.data;

    const embed = {
      title: "Говорят, звёзды приносят удачу",
      description:
        "Каждая из них имеет свои недостатки и особенности, просто выберите ту, которая вам по нраву.",
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.avatarURL(),
      },
      footer: {
        text: 'Вы всегда сможете изменить выбор — "!штука я"\nТакже не забывайте улучшать её способности командой "!штука улучшить"',
      },
      fields: Elements.map((elementBase) => ({
        name: `**${elementBase.emoji} ${elementBase.name}**`,
        value: `${elementBase.label}.`,
      })),
    };

    const message = await interaction.channel.msg(embed);
    const reactions = Elements.map((elementBase) => elementBase.emoji);
    const react = await message.awaitReact(
      { user: interaction.user, removeType: "all" },
      ...reactions,
    );
    message.delete();

    const index = reactions.indexOf(react);
    if (~index === 0) {
      return;
    }

    userData.element = index;
    const elementBase = Elements.at(index);
    interaction.channel.msg({
      title: `${elementBase.name} ${elementBase.emoji} — Вы выбрали элемент`,
      description: elementBase.description,
    });

    return;
  }

  async displayIncreaseLevelInterface(interaction) {
    const { user } = interaction;
    const userData = user.data;

    const elementBase = this.constructor.Elements.at(userData.element);

    const embedColor = elementBase.color;

    if (userData.elementLevel >= this.constructor.MAX_LEVEL) {
      interaction.channel.msg({
        title:
          "Ваша штука итак очень сильная.\nПоэтому пятый уровень — максимальный.",
        delete: 7000,
      });
      return;
    }
    const endingSuffics = {
      coins: ["коин", "ов", "а", "ов"],
      berrys: ["клубник", "", "и", ""],
      voidRituals: ["ритуал", "ов", "а", "ов"],
    };

    const checkResources = () => {
      // Проверяем АКТУАЛЬНЫЙ уровень
      const level = userData.elementLevel || 0;
      const table = [
        { berrys: 5, coins: 500, voidRituals: 2 },
        { berrys: 15, coins: 1500, voidRituals: 3 },
        { berrys: 38, coins: 3337, voidRituals: 5 },
        { berrys: 200, coins: 30000, voidRituals: 10 },
      ][level];

      const noEnought = Object.entries(table)
        .filter(([key, value]) => value > userData[key])
        .map(([key, value]) =>
          Util.ending(value - (userData[key] ?? 0), ...endingSuffics[key]),
        );
      // Если ресурсов хватает, вернуть объект, иначе массив недостающих елементов.
      return noEnought.at(-1) ? noEnought : table;
    };

    const resourcesInfo = checkResources();
    if (!(resourcesInfo instanceof Array)) {
      const confirmation = await interaction.channel.msg({
        title: "Подтвердите",
        description: `Улучшение стоит целых ${Util.ending(
          resourcesInfo.coins,
          ...endingSuffics.coins,
        )} и ${Util.ending(
          resourcesInfo.berrys,
          ...endingSuffics.berrys,
        )}\nВы хотите продолжить?`,
        color: embedColor,
      });
      const react = await confirmation.awaitReact(
        { user: interaction.user, removeType: "all" },
        "685057435161198594",
        "763804850508136478",
      );
      confirmation.delete();
      if (react !== "685057435161198594") {
        return;
      }
      if (checkResources() instanceof Array) {
        interaction.channel.msg({
          title: "Как это вообще работает..?",
          color: embedColor,
          description:
            "У вас резко пропали необходимые ресурсы, вы не можете улучшить штуку.",
          author: { name: "Упс.." },
        });
        return;
      }

      addResource({
        user,
        value: -resourcesInfo.berrys,
        executor: user,
        source: "command.thing.increaseThingLevel",
        resource: PropertiesEnum.berrys,
        context: { interaction, resourcesInfo },
      });
      addResource({
        user,
        value: -resourcesInfo.coins,
        executor: user,
        source: "command.thing.increaseThingLevel",
        resource: PropertiesEnum.coins,
        context: { interaction, resourcesInfo },
      });

      userData.elementLevel = (userData.elementLevel || 0) + 1;
      interaction.channel.msg({
        title: `Непослушная сила улучшена до ${
          userData.elementLevel + 1
        } уровня!`,
        description:
          "Апгрейды открывают новые события, а такккж-е штука становится более непредсказуемой, принося немrror} больше коинов.",
        color: embedColor,
        author: {
          name: interaction.user.username,
          iconURL: interaction.user.avatarURL(),
        },
      });
      return;
    }

    interaction.channel.msg({
      title: "Как это вообще работает..?",
      color: elementBase.color,
      description: `Не хватает ${Util.joinWithAndSeparator(
        resourcesInfo,
      )}, чтобы улучшить эту клятую штуку.`,
      author: {
        iconURL:
          "https://media.discordapp.net/attachments/629546680840093696/855129807750299698/original.gif",
        name: "Упс..",
      },
    });
    return;
  }

  async onChatInput(msg, interaction) {
    if (interaction.mention) {
      const userData = interaction.mention.data;
      const elementIndex = userData.element ?? null;

      const element =
        elementIndex !== undefined
          ? this.constructor.Elements.at(elementIndex)
          : null;
      return this.displayUserInfo({ element, interaction });
    }

    const userData = interaction.user.data;
    const { element } = userData;

    if (!userData.voidRituals) {
      this.displayThingIsClosed(interaction);
      return;
    }

    const needSelectInterface =
      element === undefined || Util.match(interaction.params, /^(?:я|i)/i);
    if (needSelectInterface) {
      this.displaySelectElementInterface(interaction);
      return;
    }

    if (Util.match(interaction.params, /улучшить|up|level|уровень|ап/i)) {
      this.displayIncreaseLevelInterface(interaction);
      return;
    }

    const elementBase = this.constructor.Elements.at(element);
    const { cooldownThresholder, COOLDOWN } = this.getCooldownInfo();

    if (userData.CD_52 > cooldownThresholder) {
      this.displayThingIsInCooldown({
        interaction,
        cooldownThresholder,
        elementBase,
      });
      msg.delete();
      return;
    }

    await this.run({
      user: interaction.user,
      channel: interaction.channel,
      elementBase,
      level: userData.elementLevel ?? 0,
      interaction,
    });
    userData.CD_52 = Math.max(userData.CD_52 ?? 0, Date.now()) + COOLDOWN;
  }

  static boss = {
    manager: import("#lib/modules/BossManager.js").then(
      (module) => (this.boss.manager = module.BossManager),
    ),

    ELEMENT_DAMAGE_MULTIPLAYER: 2,
    isAvailable: (guild) => {
      return this.boss.manager.isArrivedIn(guild);
    },
    makeDamage: (guild, user, { elementType }) => {
      const boss = guild.data.boss;
      const BASE_DAMAGE = 400;
      const DAMAGE_SOURCE_TYPE = this.boss.manager.DAMAGE_SOURCES.thing;

      const multiplayer =
        boss.elementType === elementType
          ? this.boss.ELEMENT_DAMAGE_MULTIPLAYER
          : 1;
      const damage = BASE_DAMAGE * multiplayer;

      const dealt = this.boss.manager.makeDamage(boss, damage, {
        sourceUser: user,
        damageSourceType: DAMAGE_SOURCE_TYPE,
      });
      return dealt;
    },
  };

  options = {
    name: "thing",
    id: 52,
    media: {
      description:
        '\n\nПовезло-повезло:\n1) Даёт деньги в банк сервера\n2) Абсолютно рандомная и непредсказуемая фигня\n3) Также даёт неплохие бонусы\nПссс, человек, я принимаю идеи по добавлению новых ивентов, надеюсь, ты знаешь где меня искать..\n\n✏️\n```python\n!thing <"улучшить" | "я">\n```\n\n',
    },
    alias: "шутка штука aught аугт нечто штуковина щось річ",
    allowDM: true,
    type: "other",
  };
}

export default Command;
export { Elements, elementsEnum };
