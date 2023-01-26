import * as Util from '#src/modules/util.js';
import EventsManager from '#src/modules/EventsManager.js';
import CurseManager from '#src/modules/CurseManager.js';
import DataManager from '#src/modules/DataManager.js';
import TimeEventsManager from '#src/modules/TimeEventsManager.js';
import { Actions } from '#src/modules/ActionManager.js';
import { Collection } from '@discordjs/collection';

const Elements = new Collection(Object.entries({
  earth: {
    key: "earth",
    color: "#34cc49",
    emoji: "🍃",
    name: "Земля",
    label: "Создает нечто из ничего",
    description: "Стабильность — медленно, но верно доведёт вас до вершин. Большой шанс получить ключи, коины, перцы и т.д., без рисков на неудачу.",
    index: 0,
    incomeCoefficient: 1
  },
  wind: {
    key: "wind",
    color: "#a3ecf1",
    emoji: "☁️",
    name: "Воздух",
    label: "В естественном потоке меняет одно другим",
    description: "Никогда не знаешь что произойдет — скучно не будет.\nВозможно, вы получите большую сумму коинов, а на следующий день потеряете пару клубник.",
    index: 1,
    incomeCoefficient: 1.7
  },
  fire: {
    key: "fire",
    color: "#dd6400",
    emoji: "🔥",
    name: "Огонь",
    label: "Берёт старое и награждает новым",
    description: "Его отличительной чертой является стабильная многаждая вероятность навсегда увеличить награду коин-сообщения, которая никогда не сгасает.",
    index: 2,
    incomeCoefficient: 0.8
  },
  darkness: {
    key: "darkness",
    color: "#411f71",
    emoji: "👾",
    name: "Тьма",
    label: "Не оставляет ничего существующего",
    description: "Вы поступаете правильно, выбирая эту стихию, и в последствии получите свою честную нестабильность..",
    index: 3,
    incomeCoefficient: 0.2
  }
}));
const elementsEnum = Object.entries(Elements).map(({key, index}) => [key, index]);


class Command {
  static Elements = Elements;

  static EVENTS_LIST = [
    {
      id: "day",
      _weight: 80,
      description: () => ["Обычный день..", `${Util.random(1) ? "Обычный" : "Будний"} ${["Зимний", "Весенний", "Летний", "Осенний"][Math.floor((new Date().getMonth() + 1) / 3) % 4]} день...`, "Ничего не происходит.", "Происходит самое скучное событие — ничего не происходит"].random(),
      variability: [
        [
          {
            action: async ({userData, level, scene}) => {
              scene.phrase = "Вы спокойно " + ["работаете в своё удовольствие..", "занимаетесь своим огородом.."].random();
            },
            textOutput: "{scene.phrase}"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => {
              if (userData.chilli && !Util.random(5)){
                let sellingCount = Math.min(userData.chilli, 3 + userData.elementLevel) ?? 0;
                let prise = Util.random(sellingCount * 160, sellingCount * 190);
                userData.chilli -= sellingCount;
                userData.coins += prise;
                scene.phrase = `Вы смогли продать ${ Util.ending(sellingCount, "пер", "цев", "ец", "ца")} и заработали ${ prise } <:coin:637533074879414272>`;
                return;
              }

              scene.phrase = "Вы весело " + ["проводите время", "отдыхаете", "занимаетесь своим хобби", "играете в салки с воришками"].random();
            },
            textOutput: "{scene.phrase}"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => {
              scene.phrase = "Вы разумно вложили своё время" + [" в восстановление сил.", ", тренеруясь в скрытности.", ", посещая храм"].random();
            },
            textOutput: "{scene.phrase}"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => {
              scene.phrase = "Вы тратите это время на " + ["чтение интересных книг.", "развитие нового средства передвижения", "общение с приятелями", "отдых от злых дел", "сотворение невежества"].random();
            },
            textOutput: "{scene.phrase}"
          },
          false,
          false,
          false,
          false
        ],
      ]
    },
    {
      id: "bossDamage",
      _weight: 40,
      description: () => ["Вы видите босса", "Босс Вас приветствует", "Посмотрите туда, там Босс"].random(),
      variability: [
        [
          {
            action: async () => {},
            textOutput: "{scene.phrase}"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async () => {},
            textOutput: "{scene.phrase}"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async () => {},
            textOutput: "{scene.phrase}"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async () => {},
            textOutput: "{scene.phrase}"
          },
          false,
          false,
          false,
          false
        ],
      ],
      filter: ({guild}) => this.boss.isAvailable(guild),
      fastFunc: ({guild, elementBase, user, scene}) => {
        const bossElement = guild.data.boss.elementType;
        const damageDealt = this.boss.makeDamage(guild, user, {elementType: elementBase.index});
        const isSame = bossElement === elementBase.index;

        const contents = {
          dealt: `Нанесено урона по боссу ${ damageDealt } ед.`,
          multiplayer: isSame ? `, под эффектом Х${ this.boss.ELEMENT_DAMAGE_MULTIPLAYER }` : ""
        }
        
        scene.phrase = `${ contents.dealt }${ contents.multiplayer }`;
      }
    },
    {
      id: "weekdays",
      _weight: 20,
      description: "Во время прогулки в лесу на вас напал одинокий разбойник",
      variability: [
        [
          {
            action: async ({userData, level, scene}) => false,
            textOutput: "Вы с друзьями смогли отбиться и даже не поранились!"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => userData.coins -= 2,
            textOutput: "Мы бы сказали, что у вас отжали коины, но это не так, вы сами дали ему 2 монетки <:coin:637533074879414272>"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => userData.coins += 2,
            textOutput: "Вы вытрялси из него два коина <:coin:637533074879414272> и отпустили."
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => userData.coins -= 2,
            textOutput: "Он был вооружён, а вы — нет. Разумеется у вас отжали 2 коина."
          },
          false,
          false,
          false,
          false
        ],
      ],
      filterFunc: ({userData, level, scene}) => level < 2
    },
    {
      id: "huckster",
      _weight: 30,
      description: "Вам встретился очень настойчивый торговец",
      variability: [
        [
          {
            action: async ({userData, level, scene}) => false,
            textOutput: "Вас не смогли заинтересовать его товары"
          },
          false,
          false,
          false,
          {
            action: async ({userData, level, scene}) => false,
            textOutput: "Мягко говоря, выглядел он не живым уже как пять минут\nВы истратили все свои силы, чтобы спасти барыгу, но даже сейчас не приняли денег в качестве благодарности."
          }
        ],
        [
          {
            action: async ({userData, level, scene}) => {
              userData.keys += 1;
              userData.coins -= 120;
            },
            textOutput: "Вы купили у него ключ всего за 120 коинов!"
          },
          {
            action: async ({userData, level, scene}) => {
              userData.keys += 2;
              userData.coins -= 210;
            },
            textOutput: "Вы купили у него два ключа всего за 210 коинов!"
          },
          {
            action: async ({userData, level, scene}) => {
              userData.keys += 4;
              userData.coins -= 400;
            },
            textOutput: "Вы купили у него 4 ключа всего за 400 коинов!"
          },
          {
            action: async ({userData, level, scene}) => {
              userData.keys += 5;
              userData.coins -= 490;
            },
            textOutput: "Вы купили у него 5 ключей всего за 490 коинов!"
          },
          {
            action: async ({userData, level, scene}) => {
              userData.keys += 7;
              userData.coins -= 630;
            },
            textOutput: "Вы купили у него 7 ключей всего за 630 коинов!"
          }
        ],
        [
          {
            action: async ({userData, level, scene}) => {
              userData.chilli = (userData.chilli ?? 0) + 1 ;
              userData.coins -= 220;
              userData.coinsPerMessage = (userData.coinsPerMessage ?? 0) + 1;
            },
            textOutput: "Вы купили у него перец и дали на чай\nВсего пришлось заплатить 220 коинов, но и этим очень порадовали старика.\nТеперь вы получаете на одну монету больше за каждое коин-сообщение"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene, coefficient}) => {
              if ( Util.random((level + 1) / 2) ){
                userData.coins += scene.coins = Math.floor(coefficient);
                scene.phrase = `Считай, заработали ${ Util.ending(scene.coins, "коин", "ов", "", "а")}`;
              }
              else {
                userData.coins -= scene.coins = Math.floor(coefficient);
                scene.phrase = `Однако, к вашему огромною удивлению дедуля отбил вашу атаку и справедливо отобрал ваши ${Util.ending(scene.coins, "коин", "ов", "", "а")}`;
              }
            },
            textOutput: "За дерзость вы нагло забрали его товар, который он держал прямо перед вашим лицом\n{scene.phrase}"
          },
          false,
          false,
          false,
          {
            action: async ({userData, level, scene, coefficient}) => userData.coins += scene.coins = Math.floor(coefficient),
            textOutput: "За дерзость вы убили торговца, забрали его товар и наглумились, подзаработав эдак коинов {scene.coins}"
          }
        ],
      ]
    },
    {
      id: "berrys",
      _weight: 15,
      description: "Вы решили испытать магию на своей клубнике",
      variability: [
        [
          {
            action: async ({userData, level, scene}) => userData.berrys++,
            textOutput: "И вам удалось её клонировать! Собственно, у вас на одну клубнику больше."
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => Util.random(1) ? userData.berrys++ : userData.berrys--,
            textOutput: "Она то-ли увеличилась, то-ли уменьшилась. Никто так и не понял.."
          },
          {
            action: async ({userData, level, scene}) => Util.random(1) ? userData.berrys++ : DataManager.data.bot.berrysPrise++,
            textOutput: "Она вроде увеличилась, а вроде увеличилась её цена. Никто так и не понял.."
          },
          false,
          false,
          {
            action: async ({userData, level, scene}) => userData.berrys += Util.random(2),
            textOutput: "Она вроде увеличилась, а вроде ещё раз увеличилась. Вдвойне выгодно."
          },
        ],
        [
          {
            action: async ({userData, level, scene}) => {
              userData.coinsPerMessage = (userData.coinsPerMessage ?? 0) + 2 + level;
              userData.berrys--;
            },
            textOutput: "Поглотили её силу и сразу увеличили награду коин-сообщений на {2 + context.level} ед.\nК слову, клубника была действительно вкусной."
          },
          false,
          false,
          {
            action: async ({userData, level, scene}) => {
              const count = Math.min(userData.berrys, 10);
              userData.berrys -= count;

              const bonuses = Math.ceil(count * Util.random(1.2, 1.4));
              userData.chestBonus = (userData.chestBonus ?? 0) + scene.random;
              scene.bonuses = bonuses;
            },
            textOutput: `"Сыворотка для преобразования клубники в волшебные сундуки", так вы назвали свой раствор, превратив часть своей клубники в {Util.ending(scene.bonuses, "бонус", "ов", "", "а")} сундука`
          },
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => userData.berrys -= 2,
            textOutput: "В ходе экспериментов две из двух клубник превратились в прах."
          },
          false,
          false,
          {
            action: async ({userData, level, scene}) => {
              userData.berrys -= 2;
              userData.coinsPerMessage = (userData.coinsPerMessage ?? 0) + 6;
            },
            textOutput: "В ходе экспериментов вам удалось их оживить, увеличив заработок коин-сообщений на 6 единиц"
          },
          false
        ],
      ],
      filterFunc: ({userData, level, scene}) => userData.berrys > 2
    },
    {
      id: "unrealCreatures",
      _weight: ({level}) => 1 + Math.floor(level / 2),
      description: "Этой ночью ваши силы особо насищенны..",
      variability: [
        [
          {
            action: async ({userData, level, scene}) => {
              scene.random = Util.random(3, 8);
              DataManager.data.bot.berrysPrise += scene.random;
            },
            textOutput: `Эту возможность вы решили использовать, чтобы помочь другим..\nВся клубника продается на {Util.ending(scene.random, "коин", "ов", "", "а")} дороже.`
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => {
              if (Util.random(1)){
                userData.coins += 3000;
                scene.phrase = "Удача! Вы выиграли 3000 <:coin:637533074879414272> !";
                return;
              }
              userData.coins -= 1000;
              scene.phrase = "Не повезло, вы проиграли 1000 коинов <:coin:637533074879414272>";
            },
            textOutput: "Используя свои способности вы намеренны выиграть Джекпот..\n{scene.phrase}"
          },
          false,
          false,
          false,
          {
            action: async ({userData, level, scene}) => userData.coins += scene.coins = 500 * Util.random(2, 15),
            textOutput: "Повысив удачу вы построили парк развлечений и заработали {scene.coins} <:coin:637533074879414272>"
          },
        ],
        [
          {
            action: async ({userData, level, scene}) => userData.coinsPerMessage = Math.ceil((userData.coinsPerMessage ?? 0) * 1.02),
            textOutput: "Укрепили силу духа, на том и закончили. Бонус коинов за сообщения увеличен на 2%"
          },
          false,
          false,
          false,
          {
            action: async ({userData, level, scene}) => true,
            textOutput: "Долго же вы ждали этого момента...\nЭтот день — отличная возможность наведаться в межмировую потасовку.."
          },
        ],
        [
          {
            action: async ({userData, level, scene}) => {
              userData.level -= Util.random(1, 2);
              userData.void++
            },
            textOutput: "Вы породили кусок нестабильности <a:void:768047066890895360>, но потеряли много опыта и крошечку рассудка."
          },
          false,
          {
            action: async ({userData, level, scene}) => {
              userData.keys -= 5;
              userData.berrys--;
              userData.coins -= Util.random(300, 700);
              userData.void += scene.voids = Util.random(1, 2);
            },
            textOutput: `Преобразуя материальные предметы вы получаете {Util.ending(scene.voids, "уровн", "ей", "ь", "я")} нестабильности <a:void:768047066890895360>\nЦеной такого ритуала стали 5 обычных старых ключей, клубника и немного прекрасного — денег.`
          },
          false,
          {
            action: async ({userData, level, scene}) => userData.void += 2,
            textOutput: "Что может быть лучше, чем два камня нестабильности добытых из сердец слуг.. <a:void:768047066890895360>"
          },
        ],
      ]
    },
    {
      id: "fireMonkey",
      _weight: 15,
      description: "Огненная обезьяна утащила стопку ваших ключей!",
      fastFunc: ({userData, scene}) => {
        scene.stolenKeys = Util.random(3, 7);
        userData.keys -= scene.stolenKeys;
      },
      variability: [
        [
          {
            action: async ({userData, level, scene}) => false,
            textOutput: "Ваши попытки договорится не помогли.."
          },
          {
            action: async ({userData, level, scene}) => userData.keys += scene.stolenKeys,
            textOutput: "Совместно вы убедили товарища обезьяну вернуть ваши ключи"
          },
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => false,
            textOutput: "Тактика догнать и вернуть оказалась провальной..."
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => {
              scene.random = Util.random(15, 45);
              userData.coins += scene.stolenKeys * scene.random;
            },
            textOutput: "Вам удалось договорится — обезьяна взамен ключей дала вам {scene.stolenKeys * scene.random} <:coin:637533074879414272>"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => userData.berrys ? userData.berrys-- : false,
            textOutput: `Сражаться с обезьяной и угрожать ей было плохой идеей{context.user.berrys ? ", вы потеряли ещё и пару клубник (1)" : "..."}`
          },
          false,
          false,
          false,
          false
        ],
      ],
      filterFunc: ({userData, level, scene}) => level > 1 && userData.keys > 30
    },
    {
      id: "clover",
      _weight: 15,
      description: "Вам повезло оказатся рядом с великим Клевером, приносящим удачу и богатсва",
      variability: [
        [
          {
            action: async ({userData, level, scene, channel}) => {
              const clover = channel.guild.data.cloverEffect;
              const day = TimeEventsManager.Util.timestampDay(clover.timestamp);
              const filter = ({name, params}) => name === "cloverEnd" && params.includes(channel.guild.id);
              const event = TimeEventsManager.at(day).find(filter);
              TimeEventsManager.change(event, {timestamp: clover.timestamp + level * 1_200_000});
            },
            textOutput: "Вы благословили клевер, чем продлили ему жизнь на {context.level * 20} минут"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene, channel}) => {
              (async () => {
                let cloverMessage = await channel.awaitMessage({userData: false});
                let reaction;
                let i = 0;
                while ((!reaction || !reaction.me) && i < 100){
                  reaction = cloverMessage.reactions.cache.get("☘️");
                  i++;
                  await Util.sleep(100);
                }

                if (reaction && reaction.me){
                  await Util.sleep(2000);
                  let author = cloverMessage.author;
                  author.data.void++;
                  cloverMessage.msg({title: "Нестабилити!", author: {name: author.username, iconURL: author.avatarURL()}, description: `**${author.username}!!!1!!!!111111!11111!!!!** Вот это да! Магияей клевера вы превратили небольшую горстку монет в камень нестабильности <a:void:768047066890895360>\nПо информации из математических источников это удавалось всего-лишь единицам из тысяч и вы теперь входите в их число!`, reactions: ["806176512159252512"]});
                  author.action(Actions.globalQuest, {name: "cloverInstability"});
                }
              })();
            },
            textOutput: "С помощью вашей магии клевер стал сильнее. Если следующее сообщение в этом канале будет с коином, его автор получит нестабильность!"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => userData.coins += scene.coins = Util.random(10, 30),
            textOutput: "Разумеется, вы не могли упустить такого момента, и заработали {scene.coins} мелочи"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene, channel}) => {
              const clover = channel.guild.data.cloverEffect;
              const day = TimeEventsManager.Util.timestampDay(clover.timestamp);
              const filter = ({name, params}) => name === "cloverEnd" && params.includes(channel.guild.id);
              const event = TimeEventsManager.at(day).find(filter);
              TimeEventsManager.change(event, {timestamp: clover.timestamp / 2});
            },
            textOutput: "Похитили его ради своих нужд, клевер начал погибать, в попытках исправить свою ошибку вернули клевер на его место и дали немного воды... Действие эффекта уменьшено вдвое."
          },
          false,
          false,
          false,
          false
        ],
      ],
      filterFunc: ({userData, level, scene, channel}) => "cloverEffect" in channel.guild.data && level > 2
    },
    {
      id: "school",
      _weight: 5,
      description: "Тихим учебным днём...",
      variability: [
        [
          {
            action: async ({userData, level, scene}) => {
              userData.berrys++;
              DataManager.data.bot.berrysPrise += 3;
            },
            textOutput: "Труд-труд и ещё раз труд.. За усердную работу вы получили одну клубнику, а их цена на рынке поднялась на 3ед."
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => userData.coins -= 2,
            textOutput: "Школа.. Вспоминать о ней довольно грустно.\nСегодня ваше настроение было не очень весёлым"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => {
              scene.random = Util.random(1, 3);
              userData.chestBonus = (userData.chestBonus ?? 0) + scene.random;
            },
            textOutput: "Сундук знаний пополнился — Получено бонус сундука Х{scene.random}"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => userData.coins -= 2,
            textOutput: "Вы с интересом изучали Астрономию."
          },
          false,
          false,
          false,
          {
            action: async ({userData, level, scene}) => userData.coins += 782,
            textOutput: "Вы преподаете студентам курс высшей Астраномии.\nНеплохое занятие для того, кто хочет разрушить мир. Сегодня вы заработали 782 коина <:coin:637533074879414272>"
          }
        ],
      ]
    },
    {
      id: "aBeautifulFox",
      _weight: 7,
      description: "Вы встретили прекрасного лиса",
      variability: [
        [
          {
            action: async ({userData, level, scene}) => userData.chestBonus = (userData.chestBonus ?? 0) + 5,
            textOutput: "Он одарил Вас сокровищем: 5 бонусов сундука получено"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => userData.chestBonus = (userData.chestBonus ?? 0) + 5,
            textOutput: "Он одарил Вас сокровищем: 5 бонусов сундука получено"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => userData.chestBonus = (userData.chestBonus ?? 0) + 5,
            textOutput: "Он одарил Вас сокровищем: 5 бонусов сундука получено"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => userData.chestBonus = (userData.chestBonus ?? 0) + 5,
            textOutput: "Он одарил Вас сокровищем: 5 бонусов сундука получено"
          },
          false,
          false,
          false,
          false
        ],
      ]
    },
    {
      id: "curseOfWealth",
      _weight: 40,
      description: "Наверное, это инфляция. Вы не в состоянии уследить за своим богатсвом.",
      variability: [
        [
          {
            action: async ({userData, level, scene}) => userData.coins = Math.floor(userData.coins * 0.98),
            textOutput: "Даже среди ваших верных друзей нашлись предатели, 2% золота было похищено."
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => userData.coins = Math.floor(userData.coins * 0.98),
            textOutput: "Ваши богатсва обдирают прямо у вас на глазах. Вы слишком добры, чтобы их останавливать."
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => userData.coins = Math.floor(userData.coins * 0.98),
            textOutput: "Вам удается вернуть лишь часть богатсв. Ещё 2% вы таки потеряли."
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => userData.coins = Math.floor(userData.coins * 0.98),
            textOutput: "Вам ведь нет дела до каких-то монеток."
          },
          false,
          false,
          false,
          false
        ],
      ],
      filterFunc: ({userData, level, scene}) => userData.coins > 100_000_000
    },
    {
      id: "thingNotFound",
      _weight: ({userData}) => 5 + (Math.sqrt(userData.voidRituals / 2) * 5 ?? 0),
      description: "Штука Вам больше не отвечает.",
      variability: [
        [
          {
            action: async ({userData, level, scene}) => true,
            textOutput: "[`Вы ничего не можете с этим поделать`, `Не взирая на Вашу силу, это так`].random()"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => true,
            textOutput: "[`Штука просто штука.`, `Так даже лучше`].random()"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => true,
            textOutput: "[`Вы слишком сильны дня неё`, `Ваша мощь куда больше силы штуки`].random()"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => true,
            textOutput: "[`Что вам от неё нужно?!`, `Штука была вашим другом`].random()"
          },
          false,
          false,
          false,
          false
        ],
      ],
      filterFunc: ({userData, level, scene}) => userData.voidRituals > 100
    },
    {
      id: "letsMourn",
      _weight: 3,
      description: "О Вас ходят разные слухи",
      variability: [
        [
          {
            action: async ({userData, level, scene}) => true,
            textOutput: "[`Говорят, вы никакущий фермер`, `Поговаривают, что вы сами непонимаете для чего работаете`].random()"
          },
          false,
          {
            action: async ({userData, level, scene}) => true,
            textOutput: "[`Они хотят, чтобы вы рассказали побольше о своём деле`, `Всех интересует вопрос: как..?`].random()"
          },
          {
            action: async ({userData, level, scene}) => true,
            textOutput: "[`Люди думают, вы продали душу ради урожая`, `Якобы вы добились всего нечестным путём`].random()"
          },
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => true,
            textOutput: "[`Говорят, вы абсолютно легкомысленны`, `Поговаривают, что за свою жизнь вы побывали в самых разных абсурдных ситуациях`].random()"
          },
          false,
          {
            action: async ({userData, level, scene}) => true,
            textOutput: "[`Они хотят, чтобы вы рассказали как оно, быть удачливым`, `Всех интересует вопрос: как..?`].random()"
          },
          {
            action: async ({userData, level, scene}) => true,
            textOutput: "[`Люди думают, что вы крадете их удачу`, `Якобы вы добились всего нечестным путём`].random()"
          },
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => true,
            textOutput: "[`Говорят, вы странный`, `Поговаривают самые разные мифы`].random()"
          },
          false,
          {
            action: async ({userData, level, scene}) => true,
            textOutput: "[`Они хотят, чтобы вы научили их медитации`, `Всех интересует вопрос: как..?`].random()"
          },
          {
            action: async ({userData, level, scene}) => true,
            textOutput: "[`Люди думают, что у вас вообще нет эмоций`, `Якобы вы избавите этот мир от зла`].random()"
          },
          false

        ],
        [
          {
            action: async ({userData, level, scene}) => true,
            textOutput: "[`Говорят самые гадкие вещи про вас`, `Поговаривают, что в вас нет ничего святого`].random()"
          },
          false,
          {
            action: async ({userData, level, scene}) => true,
            textOutput: "[`Они хотят той же мощи, что и у ваас`, `Всех интересует вопрос: когда найдется тот, кто даст вам по башке?`].random()"
          },
          {
            action: async ({userData, level, scene}) => true,
            textOutput: "[`Люди думают, что вы их не убиваете только, чтобы творить более ужасные вещи`, `Якобы вам никогда нельзя смотреть в глаза`].random()"
          },
          false
        ]
      ]
    },
    {
      id: "curse",
      _weight: 10,
      description: "Из-за того, что вы прокляты, к вам пристала старушка",
      variability: [
        [
          {
            action: async ({userData, level, scene}) => {
              userData.coins += (level + 1) * 300;
            },
            textOutput: "— Не рискуйте так, молодой человек. Говорит она Вам. (Несколько монет получено)"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => {
              userData.coins += (level + 1) * 300;
            },
            textOutput: "— Рискуете то там, то сям, я вас понимаю. Возьмите это на всякий случай, зайдете лавку, а там приоберетете шубу от напастей. (Вы получили немного коинов)"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => {
              userData.coins += (level + 1) * 300;
            },
            textOutput: "— Угораздило же тебя пойти на такое, вот, возьми. Старушка в помощь дала вам немного монет"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => {
              const userCurse = CurseManager.userCurse(msg.author);
              userCurse.incrementProgress(1);
              CurseManager.checkAvailable(msg.author);
            },
            textOutput: "— Я помогу тебе избавиться от твоего проклятия..."
          },
          false,
          false,
          false,
          false
        ],
      ],
      filterFunc: ({userData, level, scene}) => userData.curse
    },
    {
      id: "starsInWindow",
      _weight: 2,
      description: "Когда звёзды встанут в ряд, ты прими это как знак, что всё будет впорядке...",
      variability: [
        [
          {
            action: async ({userData, level, scene}) => {
              userData.chestBonus = (userData.chestBonus || 0) + 30;
            },
            textOutput: "30 бонусов сундука получено"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => {
              userData.chestBonus = (userData.chestBonus || 0) + 30;
            },
            textOutput: "30 бонусов сундука получено"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => {
              userData.chestBonus = (userData.chestBonus || 0) + 30;
            },
            textOutput: "30 бонусов сундука получено"
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData, level, scene}) => {
              userData.chestBonus = (userData.chestBonus || 0) + 30;
            },
            textOutput: "30 бонусов сундука получено"
          },
          false,
          false,
          false,
          false
        ],
      ]
    },
    {
      id: "peoplesBecomeARich",
      _weight: 100,
      description: "На улице фантастические цены на клубнику\nЛюди продают её пока могут и обретают богатсва.",
      variability: [
        [
          {
            action: async () => {
              DataManager.data.bot.berrysPrise -= 125;
            },
            textOutput: "За последние 2с цена клубники упала на 125ед."
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({scene}) => {
              const value = random(55, 110);
              DataManager.data.bot.berrysPrise -= value;
              scene.value = value;
            },
            textOutput: `За последние 2с цена клубники упала на { scene.value }ед.`
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async () => {
              DataManager.data.bot.berrysPrise -= 50;
            },
            textOutput: `За последние 2с цена клубники упала на 50ед.`
          },
          false,
          false,
          false,
          false
        ],
        [
          {
            action: async ({userData}) => {
              DataManager.data.bot.berrysPrise -= 50;
              userData.berrys -= Math.min(userData.berrys, 5);
            },
            textOutput: "За последние 2с цена клубники упала на 50ед.\nУ вас отбирают клубнику"
          },
          false,
          false,
          false,
          {
            action: async () => {
              DataManager.data.bot.berrysPrise -= 200;
            },
            textOutput: "Вы снизили её цену на 200ед."
          },
        ],
      ],
      filter: () => DataManager.data.bot.berrysPrise >= 1_000
    }
  ];

  static BASIC_COINS_COEFFICIENT = 20;

  async run({user, elementBase, channel, level}){
    const guild = channel.guild;
    const userData = user.data;

    const coefficient = Util.random(this.constructor.BASIC_COINS_COEFFICIENT, {round: false});
    const scene = {};
    const context = {user, elementBase, channel, scene, level, guild, userData, coefficient};

    const _transformWeightOf = (event) => typeof event._weight === "function" ? {...event, _weight: event._weight(context)} : event;
    const needSkip = event => "filterFunc" in event === false || event.filterFunc(context);

    const eventBase = this.constructor.EVENTS_LIST
      .filter(needSkip)
      .map(_transformWeightOf)
      .random({weights: true});


    const actionBase = eventBase.variability[elementBase.index]
      .filter((action, i) => i <= context.level && action)
      .random();


    eventBase.fastFunc && eventBase.fastFunc(context);
  
    await actionBase.action(context);
    const output = actionBase.textOutput.replace(/\{.+?\}/g, (raw) => eval(raw.slice(1, -1)));

    const
      income = Math.round( elementBase.incomeCoefficient * (context.level + 2.5) * (coefficient + 5) ),
      phrase = ["Это птица? Это самолёт! Нет, это штука!", "Вдумайтесь..", "Ученье – свет, а неученье – штука.", "Игрушка!", "Случайности случайны.", "**ШТУКОВИНА**", "Используйте !штука я, чтобы поменять стихию", "Используйте !штука улучшить, чтобы открыть новые события"].random(),
      footerPhrase = ["кубик рубика", "сапог", "звёзду", "снеговика", "зайца", "большой город", "огненную обезьяну", "ананас", "кефир"].random();

    

    const contents = {
      guildTakeCoins: `Вы помогли серверу — он получил ${ Util.ending(income, "коин", "ов", "", "а") }`,
      event: eventBase.id === "day" ? "" : "\nЗа это время также произошло интересное событие:",
      description: typeof eventBase.description === "function" ? eventBase.description(context) : eventBase.description
    };

    channel.guild.data.coins += income;
    channel.msg({
      title: phrase, 
      description: `${ contents.guildTakeCoins }${ contents.event }`,
      color: elementBase.color,
      author: {iconURL: user.avatarURL(), name: user.username},
      fields: [{name: `Если коротко..`, value: `**${ contents.description }**\n⠀`}, {name: `${elementBase.emoji} ${context.level + 1} ур.`, value: output}],
      footer: {text: `Скажем так: эта вещь чем-то похожа на ${footerPhrase}..`}
    });
  }

  getCooldownInfo(){
    const COOLDOWN     = 10_800_000;
    const COOLDOWN_TRY = 2;
    const cooldownThresholder = Date.now() + COOLDOWN * (COOLDOWN_TRY - 1);

    return {COOLDOWN, COOLDOWN_TRY, cooldownThresholder};
  }

  displayUserInfo({interaction, element}){
    if (!element){
      interaction.channel.msg({description: "Упомянутый пользователь пока не открыл штуку.."});
      return;
    };


    const username = interaction.mention.username;

    const color = element.color;
    const emoji = element.emoji;

    const mentionContent = [username.toUpperCase(), username.toLowerCase(), username.toLowerCase()].join("-");

    const {cooldownThresholder} = this.getCooldownInfo();
    const inCooldownContent = ["Нет.", "Да."][ +(interaction.mention.data.CD_52 > cooldownThresholder) ];

    const description = `${ mentionContent }...\nВыбранная стихия: ${ emoji }\nУровень штуки: ${ (interaction.mention.data.elementLevel || 0) + 1 }\n\n${ element.description }\nНа перезарядке: ${ inCooldownContent }`
    interaction.channel.msg({description, color});
    return;
  }

  static MAX_LEVEL = 4;

  async displayThingIsClosed(interaction){
    const description = `Вам ещё недоступна эта команда\nдля её открытия совершите хотя бы один ритуал, используя команду !котёл.\nВ будущем она будет генерировать коины для сервера, а также активировать случайные события.`;
    interaction.channel.msg({title: "Штуке требуется немного магии котла,\nчтобы она могла работать.", description, delete: 22_000, reactions: ["763804850508136478"]});
    return;
  }

  async displayThingIsInCooldown({interaction, cooldownThresholder, elementBase}){
    const userData = interaction.user.data;

    const title = `${ elementBase.emoji } Штука перезаряжается!`;
    const description = `Товарищ многоуважаемый, спешу сообщить, что:\nВаш персонаж слишком устал от приключений.\n\nПерерыв на обед ещё: ${ Util.timestampToDate(userData.CD_52 - cooldownThresholder) }`;

    interaction.channel.msg({title, description, color: elementBase.color});
    return;
  }

  async displaySelectElementInterface(interaction){
    const Elements = this.constructor.Elements;
    const userData = interaction.user.data;

    const embed = {
      title: "Говорят, звёзды приносят удачу", 
      description: `Каждая из них имеет свои недостатки и особенности, просто выберите ту, которая вам по нраву.`,
      author: {
        name: interaction.user.username,
        iconURL: interaction.user.avatarURL()
      },
      footer: {
        text: `Вы всегда сможете изменить выбор — "!штука я"\nТакже не забывайте улучшать её способности командой "!штука улучшить"`
      },
      fields: Elements.map(elementBase => ({name: `**${ elementBase.emoji } ${ elementBase.name }**`, value: `${ elementBase.label }.`}))
    }

    const message = await interaction.channel.msg(embed);
    const reactions = Elements.map(elementBase => elementBase.emoji);
    const react = await message.awaitReact({user: interaction.user, removeType: "all"}, ...reactions);
    message.delete();

    const index = reactions.indexOf(react);
    if (~index === 0){
      return;
    }

    userData.element = index;
    const elementBase = Elements.at(index);
    interaction.channel.msg({
      title: `${ elementBase.name } ${ elementBase.emoji } — Вы выбрали элемент`,
      description: elementBase.description
    });

    return;
  }

  async displayIncreaseLevelInterface(interaction){
    const user = interaction.user;
    const userData = user.data;

    const elementBase = this.constructor.Elements.at(userData.element);

    if (userData.elementLevel >= this.constructor.MAX_LEVEL) {
      interaction.channel.msg({title: "Ваша штука итак очень сильная.\nПоэтому пятый уровень — максимальный.", delete: 7000});
      return;
    }
    const endingSuffics = {
      coins:       ["коин", "ов", "а", "ов"],
      berrys:      ["клубник", "", "и", ""],
      voidRituals: ["ритуал", "ов", "а", "ов"]
    }

    const checkResources = () => {
      // Проверяем АКТУАЛЬНЫЙ уровень
      const level = userData.elementLevel || 0;
      const table = [{berrys: 5, coins: 500, voidRituals: 2}, {berrys: 15, coins: 1500, voidRituals: 3}, {berrys: 38, coins: 3337, voidRituals: 5}, {berrys: 200, coins: 30000, voidRituals: 10}][level];

      const noEnought = Object.entries(table).filter(([key, value]) => value > userData[key]).map(([key, value]) =>  Util.ending(value - (userData[key] ?? 0), ...endingSuffics[key]));
      // Если ресурсов хватает, вернуть объект, иначе массив недостающих елементов.
      return noEnought.at(-1) ? noEnought : table;
    };


    const resourcesInfo = checkResources();
    if (!(resourcesInfo instanceof Array)){
      const confirmation = await interaction.channel.msg({title: "Подтвердите", description: `Улучшение стоит целых ${ Util.ending(resourcesInfo.coins, ...endingKeys.coins)} и ${ Util.ending(resourcesInfo.berrys, ...endingKeys.berrys)}\nВы хотите продолжить?`, color: embedColor});
      const react = await confirmation.awaitReact({user: interaction.user, removeType: "all"}, "685057435161198594", "763804850508136478");
      confirmation.delete();
      if (react !== "685057435161198594"){
        return;
      }
      if (checkResources() instanceof Array){
        interaction.channel.msg({title: "Как это вообще работает..?", color: embedColor, description: `У вас резко пропали необходимые ресурсы, вы не можете улучшить штуку.`, author: {name: "Упс.."}});
        return;
      }

      userData.berrys -= resourcesInfo.berrys;
      userData.coins -= resourcesInfo.coins;
      userData.elementLevel = ~~userData.elementLevel + 1;
      interaction.channel.msg({title: `Непослушная сила улучшена до ${userData.elementLevel + 1} уровня!`, description: `Апгрейды открывают новые события, а такккж-е штука становится более непредсказуемой, принося немrror} больше коинов.`, color: embedColor, delete: 9000, author: {name: interaction.user.username, iconURL: interaction.user.avatarURL()}});
      return;
    }


    interaction.channel.msg({title: "Как это вообще работает..?", color: elementBase.color, description: `Не хватает ${Util.joinWithAndSeparator(resourcesInfo)}, чтобы улучшить эту клятую штуку.`, author: {iconURL: "https://media.discordapp.net/attachments/629546680840093696/855129807750299698/original.gif", name: "Упс.."}});
    return;
  }



	async onChatInput(msg, interaction){

    if (interaction.mention){
      const userData = interaction.mention.data;
      const elementIndex = userData.element ?? null;
      

      const element = elementIndex !== undefined ? this.constructor.Elements.at(elementIndex) : null;
      return this.displayUserInfo({element, interaction});
    }

    const userData = interaction.user.data;
    const { element } = userData;


    if (!userData.voidRituals){
      this.displayThingIsClosed(interaction);
      return;
    }

    

    const needSelectInterface = element === undefined || Util.match(interaction.params, /^(?:я|i)/i);
    if (needSelectInterface){
      this.displaySelectElementInterface(interaction);
      return;
    }

    

    if (Util.match(interaction.params, /улучшить|up|level|уровень|ап/i)){
      this.displayIncreaseLevelInterface(interaction);
      return;
    }

    const elementBase = this.constructor.Elements.at(element);
    const {cooldownThresholder, COOLDOWN} = this.getCooldownInfo();

    if (userData.CD_52 > cooldownThresholder){
      this.displayThingIsInCooldown({interaction, cooldownThresholder, elementBase});
      msg.delete();
      return;
    }

    
    await this.run({user: interaction.user, channel: interaction.channel, elementBase, level: userData.elementLevel ?? 0});
    userData.CD_52 = Math.max(userData.CD_52 ?? 0, Date.now()) + COOLDOWN;
  }

  

  static boss = {
    manager: import("#src/modules/BossManager.js")
      .then((module) => this.boss.manager = module.BossManager),

    ELEMENT_DAMAGE_MULTIPLAYER: 2,
    isAvailable: (guild) => {
      return this.boss.manager.isArrivedIn(guild);
    },
    makeDamage: (guild, user, {elementType}) => {
      const boss = guild.data.boss;
      const BASE_DAMAGE = 400;
      const DAMAGE_SOURCE_TYPE = this.boss.manager.DAMAGE_SOURCES.thing;

      const multiplayer = boss.elementType === elementType ? this.boss.ELEMENT_DAMAGE_MULTIPLAYER : 1;
      const damage = BASE_DAMAGE * multiplayer;


      const dealt = this.boss.manager.makeDamage(boss, damage, {sourceUser: user, damageSourceType: DAMAGE_SOURCE_TYPE});
      return dealt;
    }
  }


	options = {
	  "name": "thing",
	  "id": 52,
	  "media": {
	    "description": "\n\nПовезло-повезло:\n1) Даёт деньги в банк сервера\n2) Абсолютно рандомная и непредсказуемая фигня\n3) Также даёт неплохие бонусы\nПссс, человек, я принимаю идеи по добавлению новых ивентов, надеюсь, ты знаешь где меня искать..\n\n:pencil2:\n```python\n!thing <\"улучшить\" | \"я\">\n```\n\n"
	  },
	  "allias": "шутка штука aught аугт нечто",
		"allowDM": true,
		"type": "other"
	};
};

export default Command;
export {Elements, elementsEnum};