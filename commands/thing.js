import * as Util from '#src/modules/util.js';
import EventsManager from '#src/modules/EventsManager.js';
import CurseManager from '#src/modules/CurseManager.js';
import DataManager from '#src/modules/DataManager.js';
import TimeEventsManager from '#src/modules/TimeEventsManager.js';
import { Actions } from '#src/modules/ActionManager.js';

class Command {

	async onChatInput(msg, interaction){

    const getColor = (element) => ["34cc49", "a3ecf1", "dd6400", "411f71"][element];
    const getEmoji = (element) => ["🍃", "☁️", "🔥", "👾"][element];

    const getCooldownInfo = () => {
      const COOLDOWN     = 10800000;
      const COOLDOWN_TRY = 2;
      const cooldownThresholder = Date.now() + COOLDOWN * (COOLDOWN_TRY - 1);

      return {COOLDOWN, COOLDOWN_TRY, cooldownThresholder};
    }

    if (interaction.mention){
      const element = interaction.mention.data.element || null;
      if (element === null){
        msg.msg({description: "Упомянутый пользователь пока не открыл штуку.."});
        return;
      }

      const username = interaction.mention.username;

      const color = getColor(element);
      const emoji = getEmoji(element);

      // ENOT-enot-enot...
      const mentionContent = [username.toUpperCase(), username.toLowerCase(), username.toLowerCase()].join("-");

      const {cooldownThresholder} = getCooldownInfo();
      const inCooldownContent = ["Нет.", "Да."][ +(interaction.mention.data.CD_52 > cooldownThresholder) ];

      const description = `${ mentionContent }...\nВыбранная стихия: ${ emoji }\nУровень штуки: ${ (interaction.mention.data.elementLevel || 0) + 1 }\n\nНа перезарядке: ${ inCooldownContent }`
      msg.msg({description, color});
      return;
    }

    let user = msg.author.data;
    let { element, elementLevel } = user;


    if (!user.voidRituals){
      msg.msg({title: "Штуке требуется немного магии котла,\nчтобы она могла работать.", description: `Вам ещё недоступна эта команда\nдля её открытия нужно совершить хотя бы один ритуал используя команду !котёл.\nВ будущем она будет давать коины для сервера, а также активировать случайные события. `, delete: 7000});
      return;
    }
    let react, answer;

    if (Util.match(interaction.params, /^(?:я|i'm|i)/i)){
      let elementSelect = await msg.msg({
        title: "Говорят, звёзды приносят удачу", 
        description: `Каждая из них имеет свои недостатки и особенности, просто выберите ту, которая вам по нраву.`,
        fields: [
          {
            value: "Создает нечто из ничего.",
            name: "**🍃 Земля**"
          },
          {
            value: "В естественном потоке меняет одно другим.",
            name: "**☁️ Воздух**"
          },
          {
            value: "Бёрет старое и награждает новым.",
            name: "**🔥 Огонь**"
          },
          {
            value: "Не оставляет ничего существующего.",
            name: "**👾 Тьма**"
          }
        ],
        author: {
          name: msg.author.username,
          iconURL: msg.author.avatarURL()
        },
        footer: {
          text: `Вы всегда сможете изменить выбор — "!штука я"\nТакже не забывайте улучшать её способности командой "!штука улучшить"`
        }
      });
      react = await elementSelect.awaitReact({user: msg.author, removeType: "all"}, "🍃", "☁️", "🔥", "👾");
      elementSelect.delete();
      switch (react){
        case "🍃":
          user.element = 0;
          msg.msg({title: "Вы выбрали Землю 🍃", description: `Стабильность — медленно, но верно доведёт вас до вершин. Большой шанс получить ключи, коины, перцы и т.д., без рисков на неудачу.`});
          break;
        case "☁️":
          user.element = 1;
          msg.msg({title: "Вы выбрали Воздух ☁️", description: `Никогда не знаешь что произойдет — скучно не будет.\nВозможно, вы получите большую сумму коинов, а на следующий день потеряете пару клубник.`});
          break;
        case "🔥":
          user.element = 2;
          msg.msg({title: "Вы выбрали Огонь 🔥", description: `Его отличительной чертой является стабильная многаждая вероятность навсегда увеличить награду коин-сообщения, которая никогда не сгасает.`});
          break;
        case "👾":
          user.element = 3;
          msg.msg({title: "Вы выбрали Тьму 👾", description: `Вы поступаете правильно, выбирая эту стихию, и в последствии получите свою честную нестабильность..`});
          break;
      }
      return;
    }

    if (element === undefined){
      return commands.thing.code(msg, {command: "thing", args: "я"});
    }

    let emoji = getEmoji(element);
    let embedColor = getColor(element);
    let level = elementLevel || 0;

    if (Util.match(interaction.params, /улучшить|up|level|уровень|ап/i)){

      if (user.elementLevel == 4) {
        msg.msg({title: "Ваша штука итак очень сильная.\nПоэтому разработчик решил, что пятый уровень — максимальный.", delete: 7000});
        return;
      }
      let endingKeys = {
        coins:       ["коин", "ов", "а", "ов"],
        berrys:      ["клубник", "", "и", ""],
        voidRituals: ["ритуал", "ов", "а", "ов"]
      }

      const checkResources = () => {
        // Проверяем АКТУАЛЬНЫЙ уровень
        let level = user.elementLevel || 0;
        let resources = [{berrys: 5, coins: 500, voidRituals: 2}, {berrys: 15, coins: 1500, voidRituals: 3}, {berrys: 38, coins: 3337, voidRituals: 5}, {berrys: 200, coins: 30000, voidRituals: 10}][level];

        let noEnought = Object.entries(resources).filter(([k, v]) => v > user[k]).map(([k, v]) =>  Util.ending(v - (user[k] ?? 0), ...endingKeys[k]));
        // Если ресурсов хватает, вернуть объект, иначе массив недостающих елементов.
        return noEnought.at(-1) ? noEnought : resources;
      };


      let resourcesInfo = checkResources();
      if (!(resourcesInfo instanceof Array)){
        let confirmation = await msg.msg({title: "Подтвердите", description: `Улучшение стоит целых ${ Util.ending(resourcesInfo.coins, ...endingKeys.coins)} и ${ Util.ending(resourcesInfo.berrys, ...endingKeys.berrys)}\nВы хотите продолжить?`, color: embedColor});
        let react = await confirmation.awaitReact({user: msg.author, removeType: "all"}, "685057435161198594", "763804850508136478");
        confirmation.delete();
        if (react != "685057435161198594"){
          return;
        }
        resourcesInfo = checkResources();
        if (resourcesInfo instanceof Array){
          msg.msg({title: "Как это вообще работает..?", color: embedColor, description: `У вас резко пропали необходимые ресурсы, вы не можете улучшить штуку.`, author: {name: "Упс.."}});
          return;
        }

        user.berrys -= resourcesInfo.berrys;
        user.coins -= resourcesInfo.coins;
        user.elementLevel = ~~user.elementLevel + 1;
        msg.msg({title: `Непослушная сила улучшена до ${user.elementLevel + 1} уровня!`, description: `Апгрейды открывают новые события, а такккж-е штука становится более непредсказуемой, принося немrror} больше коинов.`, color: embedColor, delete: 9000, author: {name: msg.author.username, iconURL: msg.author.avatarURL()}});
        return;
      }


      msg.msg({title: "Как это вообще работает..?", color: embedColor, description: `Не хватает ${Util.joinWithAndSeparator(resourcesInfo)}, чтобы улучшить эту клятую штуку.`, author: {iconURL: "https://media.discordapp.net/attachments/629546680840093696/855129807750299698/original.gif", name: "Упс.."}});
      return;
    }

    const {cooldownThresholder, COOLDOWN} = getCooldownInfo();

    if (user.CD_52 > cooldownThresholder){
      const title = `${ emoji } Штука перезаряжается!`;
      const description = `Товарищ многоуважаемый, спешу сообщить, что:\nВаш персонаж слишком устал от приключений.\n\nПерерыв на обед ещё: ${ Util.timestampToDate(user.CD_52 - cooldownThresholder) }`;

      msg.delete();

      msg.msg({title, description, color: embedColor});
      return;
    }


    user.CD_52 = Math.max(user.CD_52 ?? 0, Date.now()) + COOLDOWN;

    let k = Util.random(20, {round: false});

    const scene = [
      {
        id: "day",
        _weight: 80,
        description: ["Обычный день..", `${Util.random(1) ? "Обычный" : "Будний"} ${["Зимний", "Весенний", "Летний", "Осенний"][Math.floor((new Date().getMonth() + 1) / 3) % 4]} день...`, "Ничего не происходит.", "Происходит самое скучное событие — ничего не происходит"].random(),
        variability: [
          [
            {
              action: async () => {
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
              action: async () => {
                if (user.chilli && !Util.random(5)){
                  let sellingCount = Math.min(user.chilli, 3 + user.elementLevel) ?? 0;
                  let prise = Util.random(sellingCount * 160, sellingCount * 190);
                  user.chilli -= sellingCount;
                  user.coins += prise;
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
              action: async () => {
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
              action: async () => {
                scene.phrase = "Вы тратите это время на " + ["чтение интересных книг.", "развитие нового средства передвижения", "общение с приятелями", "отдых от злых дел", "сотворение невежества"].random();
              },
              textOutput: "{scene.phrase}"
            },
            false,
            false,
            false,
            false
          ],
        ],
        filterFunc: () => true
      },
      {
        id: "weekdays",
        _weight: 20,
        description: "Во время прогулки в лесу на вас напал одинокий разбойник",
        variability: [
          [
            {
              action: async () => false,
              textOutput: "Вы с друзьями смогли отбиться и даже не поранились!"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.coins -= 2,
              textOutput: "Мы бы сказали, что у вас отжали коины, но это не так, вы сами дали ему 2 монетки <:coin:637533074879414272>"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.coins += 2,
              textOutput: "Вы вытрялси из него два коина <:coin:637533074879414272> и отпустили."
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.coins -= 2,
              textOutput: "Он был вооружён, а вы — нет. Разумеется у вас отжали 2 коина."
            },
            false,
            false,
            false,
            false
          ],
        ],
        filterFunc: () => level < 2
      },
      {
        id: "huckster",
        _weight: 30,
        description: "Вам встретился очень настойчивый торговец",
        variability: [
          [
            {
              action: async () => false,
              textOutput: "Вас не смогли заинтересовать его товары"
            },
            false,
            false,
            false,
            {
              action: async () => false,
              textOutput: "Мягко говоря, выглядел он не живым уже как пять минут\nВы истратили все свои силы, чтобы спасти барыгу, но даже сейчас не приняли денег в качестве благодарности."
            }
          ],
          [
            {
              action: async () => {
                user.keys += 1;
                user.coins -= 120;
              },
              textOutput: "Вы купили у него ключ всего за 120 коинов!"
            },
            {
              action: async () => {
                user.keys += 2;
                user.coins -= 210;
              },
              textOutput: "Вы купили у него два ключа всего за 210 коинов!"
            },
            {
              action: async () => {
                user.keys += 4;
                user.coins -= 400;
              },
              textOutput: "Вы купили у него 4 ключа всего за 400 коинов!"
            },
            {
              action: async () => {
                user.keys += 5;
                user.coins -= 490;
              },
              textOutput: "Вы купили у него 5 ключей всего за 490 коинов!"
            },
            {
              action: async () => {
                user.keys += 7;
                user.coins -= 630;
              },
              textOutput: "Вы купили у него 7 ключей всего за 630 коинов!"
            }
          ],
          [
            {
              action: async () => {
                user.chilli = (user.chilli ?? 0) + 1 ;
                user.coins -= 220;
                user.coinsPerMessage = (user.coinsPerMessage ?? 0) + 1;
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
              action: async () => {
                if ( Util.random((level + 1) / 2) ){
                  user.coins += scene.coins = Math.floor(k);
                  scene.phrase = `Считай, заработали ${ Util.ending(scene.coins, "коин", "ов", "", "а")}`;
                }
                else {
                  user.coins -= scene.coins = Math.floor(k);
                  scene.phrase = `Однако, к вашему огромною удивлению дедуля отбил вашу атаку и справедливо отобрал ваши ${Util.ending(scene.coins, "коин", "ов", "", "а")}`;
                }
              },
              textOutput: "За дерзость вы нагло забрали его товар, который он держал прямо перед вашим лицом\n{scene.phrase}"
            },
            false,
            false,
            false,
            {
              action: async () => user.coins += scene.coins = Math.floor(k),
              textOutput: "За дерзость вы убили торговца, забрали его товар и наглумились, подзаработав эдак коинов {scene.coins}"
            }
          ],
        ],
        filterFunc: () => true
      },
      {
        id: "berrys",
        _weight: 15,
        description: "Вы решили испытать магию на своей клубнике",
        variability: [
          [
            {
              action: async () => user.berrys++,
              textOutput: "И вам удалось её клонировать! Собственно, у вас на одну клубнику больше."
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => Util.random(1) ? user.berrys++ : user.berrys--,
              textOutput: "Она то-ли увеличилась, то-ли уменьшилась. Никто так и не понял.."
            },
            {
              action: async () => Util.random(1) ? user.berrys++ : DataManager.data.bot.berrysPrise++,
              textOutput: "Она вроде увеличилась, а вроде увеличилась её цена. Никто так и не понял.."
            },
            false,
            false,
            {
              action: async () => user.berrys += Util.random(2),
              textOutput: "Она вроде увеличилась, а вроде ещё раз увеличилась. Вдвойне выгодно."
            },
          ],
          [
            {
              action: async () => {
                user.coinsPerMessage = (user.coinsPerMessage ?? 0) + 2 + level;
                user.berrys--;
              },
              textOutput: `Поглотили её силу и сразу увеличили награду коин-сообщений на ${2 + level} ед.\nК слову, клубника была действительно вкусной.`
            },
            false,
            false,
            {
              action: async () => {
                const count = user.berrys;
                user.berrys -= count;

                const bonuses = Math.ceil(count * Util.random(1.2, 1.4));
                user.chestBonus = (user.chestBonus ?? 0) + scene.random;
                scene.bonuses = bonuses;
              },
              textOutput: `"Сыворотка для преобразования клубники в волшебные сундуки", так вы назвали свой раствор превратив все свои клубники в {Util.ending(scene.bonuses, "бонус", "ов", "", "а")} сундука`
            },
            false
          ],
          [
            {
              action: async () => user.berrys -= 2,
              textOutput: "В ходе экспериментов две из двух клубник превратились в прах."
            },
            false,
            false,
            {
              action: async () => {
                user.berrys -= 2;
                user.coinsPerMessage = (user.coinsPerMessage ?? 0) + 6;
              },
              textOutput: "В ходе экспериментов вам удалось их оживить, увеличив заработок коин-сообщений на 6 единиц"
            },
            false
          ],
        ],
        filterFunc: () => user.berrys > 2
      },
      {
        id: "unrealCreatures",
        _weight: 1 + Math.floor(level / 2),
        description: "Этой ночью ваши силы особо насищенны..",
        variability: [
          [
            {
              action: async () => {
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
              action: async () => {
                if (Util.random(1)){
                  user.coins += 3000;
                  scene.phrase = "Удача! Вы выиграли 3000 <:coin:637533074879414272> !";
                  return;
                }
                user.coins -= 1000;
                scene.phrase = "Не повезло, вы проиграли 1000 коинов <:coin:637533074879414272>";
              },
              textOutput: "Используя свои способности вы намеренны выиграть Джекпот..\n{scene.phrase}"
            },
            false,
            false,
            false,
            {
              action: async () => user.coins += scene.coins = 500 * Util.random(2, 15),
              textOutput: "Повысив удачу вы построили парк развлечений и заработали {scene.coins} <:coin:637533074879414272>"
            },
          ],
          [
            {
              action: async () => user.coinsPerMessage = Math.ceil((user.coinsPerMessage ?? 0) * 1.02),
              textOutput: `Укрепили силу духа, на том и закончили. Бонус коинов за сообщения увеличен на 2%`
            },
            false,
            false,
            false,
            {
              action: async () => true,
              textOutput: `Долго же вы ждали этого момента...\nЭтот день — отличная возможность наведаться в межмировую потасовку..`
            },
          ],
          [
            {
              action: async () => {
                user.level -= Util.random(1, 2);
                user.void++
              },
              textOutput: "Вы породили кусок нестабильности <a:void:768047066890895360>, но потеряли много опыта и крошечку рассудка."
            },
            false,
            {
              action: async () => {
                user.keys -= 5;
                user.berrys--;
                user.coins -= Util.random(300, 700);
                user.void += scene.voids = Util.random(1, 2);
              },
              textOutput: `Преобразуя материальные предметы вы получаете {Util.ending(scene.voids, "уровн", "ей", "ь", "я")} нестабильности <a:void:768047066890895360>\nЦеной такого ритуала стали 5 обычных старых ключей, клубника и немного прекрасного — денег.`
            },
            false,
            {
              action: async () => user.void += 2,
              textOutput: "Что может быть лучше, чем два камня нестабильности добытых из сердец слуг.. <a:void:768047066890895360>"
            },
          ],
        ],
        filterFunc: () => true
      },
      {
        id: "fireMonkey",
        _weight: 15,
        description: "Огненная обезьяна утащила стопку ваших ключей!",
        fastFunc: () => {
          scene.stolenKeys = Util.random(3, 7);
          user.keys -= scene.stolenKeys;
        },
        variability: [
          [
            {
              action: async () => false,
              textOutput: "Ваши попытки договорится не помогли.."
            },
            {
              action: async () => user.keys += scene.stolenKeys,
              textOutput: "Совместно вы убедили товарища обезьяну вернуть ваши ключи"
            },
            false,
            false,
            false
          ],
          [
            {
              action: async () => false,
              textOutput: "Тактика догнать и вернуть оказалась провальной..."
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => {
                scene.random = Util.random(15, 45);
                user.coins += scene.stolenKeys * scene.random;
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
              action: async () => user.berrys ? user.berrys-- : false,
              textOutput: `Сражаться с обезьяной и угрожать ей было плохой идеей${user.berrys ? ", вы потеряли ещё и пару клубник (1)" : "..."}`
            },
            false,
            false,
            false,
            false
          ],
        ],
        filterFunc: () => level > 1 && user.keys > 30
      },
      {
        id: "clover",
        _weight: 15,
        description: "Вам повезло оказатся рядом с великим Клевером, приносящим удачу и богатсва",
        variability: [
          [
            {
              action: async () => {
                const clover = msg.guild.data.cloverEffect;
                const day = TimeEventsManager.Util.timestampDay(clover.timestamp);
                const filter = ({name, params}) => name === "cloverEnd" && params.includes(msg.guild.id);
                const event = TimeEventsManager.at(day).find(filter);
                TimeEventsManager.change(event, {timestamp: clover.timestamp + level * 1_200_000});
              },
              textOutput: `Вы благословили клевер, чем продлили ему жизнь на ${level * 20} минут`
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => {
                (async () => {
                  let cloverMessage = await msg.channel.awaitMessage({user: false});
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
              action: async () => user.coins += scene.coins = Util.random(10, 30),
              textOutput: "Разумеется, вы не могли упустить такого момента, и заработали {scene.coins} мелочи"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => {
                const clover = msg.guild.data.cloverEffect;
                const day = TimeEventsManager.Util.timestampDay(clover.timestamp);
                const filter = ({name, params}) => name === "cloverEnd" && params.includes(msg.guild.id);
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
        filterFunc: () => "cloverEffect" in msg.guild.data && level > 2
      },
      {
        id: "school",
        _weight: 5,
        description: "Тихим учебным днём...",
        variability: [
          [
            {
              action: async () => {
                user.berrys++;
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
              action: async () => user.coins -= 2,
              textOutput: "Школа.. Вспоминать о ней довольно грустно.\nСегодня ваше настроение было не очень весёлым"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => {
                scene.random = Util.random(1, 3);
                user.chestBonus = (user.chestBonus ?? 0) + scene.random;
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
              action: async () => user.coins -= 2,
              textOutput: "Вы с интересом изучали Астрономию."
            },
            false,
            false,
            false,
            {
              action: async () => user.coins += 782,
              textOutput: "Вы преподаете студентам курс высшей Астраномии.\nНеплохое занятие для того, кто хочет разрушить мир. Сегодня вы заработали 782 коина <:coin:637533074879414272>"
            }
          ],
        ],
        filterFunc: () => true
      },
      {
        id: "aBeautifulFox",
        _weight: 7,
        description: "Вы встретили прекрасного лиса",
        variability: [
          [
            {
              action: async () => user.chestBonus = (user.chestBonus ?? 0) + 5,
              textOutput: "Он одарил Вас сокровищем: 5 бонусов сундука получено"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.chestBonus = (user.chestBonus ?? 0) + 5,
              textOutput: "Он одарил Вас сокровищем: 5 бонусов сундука получено"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.chestBonus = (user.chestBonus ?? 0) + 5,
              textOutput: "Он одарил Вас сокровищем: 5 бонусов сундука получено"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.chestBonus = (user.chestBonus ?? 0) + 5,
              textOutput: "Он одарил Вас сокровищем: 5 бонусов сундука получено"
            },
            false,
            false,
            false,
            false
          ],
        ],
        filterFunc: () => true
      },
      {
        id: "curseOfWealth",
        _weight: 40,
        description: "Наверное, это инфляция. Вы не в состоянии уследить за своим богатсвом.",
        variability: [
          [
            {
              action: async () => user.coins = Math.floor(user.coins * 0.98),
              textOutput: "Даже среди ваших верных друзей нашлись предатели, 2% золота было похищено."
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.coins = Math.floor(user.coins * 0.98),
              textOutput: "Ваши богатсва обдирают прямо у вас на глазах. Вы слишком добры, чтобы их останавливать."
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.coins = Math.floor(user.coins * 0.98),
              textOutput: "Вам удается вернуть лишь часть богатсв. Ещё 2% вы таки потеряли."
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.coins = Math.floor(user.coins * 0.98),
              textOutput: "Вам ведь нет дела до каких-то монеток."
            },
            false,
            false,
            false,
            false
          ],
        ],
        filterFunc: () => user.coins > 100_000_000
      },
      {
        id: "thingNotFound",
        _weight: 5 + (Math.sqrt(user.voidRituals / 2) * 5 ?? 0),
        description: "Штука Вам больше не отвечает.",
        variability: [
          [
            {
              action: async () => true,
              textOutput: ["Вы ничего не можете с этим поделать", "Не взирая на Вашу силу, это так"].random()
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => true,
              textOutput: ["Штука просто штука.", "Так даже лучше"].random()
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => true,
              textOutput: ["Вы слишком сильны дня неё", "Ваша мощь куда больше силы штуки"].random()
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => true,
              textOutput: ["Что вам от неё нужно?!", "Штука была вашим другом"].random()
            },
            false,
            false,
            false,
            false
          ],
        ],
        filterFunc: () => user.voidRituals > 100
      },
      {
        id: "letsMourn",
        _weight: 3,
        description: "О Вас ходят разные слухи",
        variability: [
          [
            {
              action: async () => true,
              textOutput: ["Говорят, вы никакущий фермер", "Поговаривают, что вы сами непонимаете для чего работаете"].random()
            },
            false,
            {
              action: async () => true,
              textOutput: ["Они хотят, чтобы вы рассказали побольше о своём деле", "Всех интересует вопрос: как..?"].random()
            },
            {
              action: async () => true,
              textOutput: ["Люди думают, вы продали душу ради урожая", "Якобы вы добились всего нечестным путём"].random()
            },
            false
          ],
          [
            {
              action: async () => true,
              textOutput: ["Говорят, вы абсолютно легкомысленны", "Поговаривают, что за свою жизнь вы побывали в самых разных абсурдных ситуациях"].random()
            },
            false,
            {
              action: async () => true,
              textOutput: ["Они хотят, чтобы вы рассказали как оно, быть удачливым", "Всех интересует вопрос: как..?"].random()
            },
            {
              action: async () => true,
              textOutput: ["Люди думают, что вы крадете их удачу", "Якобы вы добились всего нечестным путём"].random()
            },
            false
          ],
          [
            {
              action: async () => true,
              textOutput: ["Говорят, вы странный", "Поговаривают самые разные мифы"].random()
            },
            false,
            {
              action: async () => true,
              textOutput: ["Они хотят, чтобы вы научили их медитации", "Всех интересует вопрос: как..?"].random()
            },
            {
              action: async () => true,
              textOutput: ["Люди думают, что у вас вообще нет эмоций", "Якобы вы избавите этот мир от зла"].random()
            },
            false

          ],
          [
            {
              action: async () => true,
              textOutput: ["Говорят самые гадкие вещи про вас", "Поговаривают, что в вас нет ничего святого"].random()
            },
            false,
            {
              action: async () => true,
              textOutput: ["Они хотят той же мощи, что и у ваас", "Всех интересует вопрос: когда найдется тот, кто даст вам по башке?"].random()
            },
            {
              action: async () => true,
              textOutput: ["Люди думают, что вы их не убиваете только, чтобы творить более ужасные вещи", "Якобы вам никогда нельзя смотреть в глаза"].random()
            },
            false
          ]
        ],
        filterFunc: () => true
      },
      {
        id: "curse",
        _weight: 10,
        description: "Из-за того, что вы прокляты, к вам пристала старушка",
        variability: [
          [
            {
              action: async () => {
                user.coins += (level + 1) * 300;
              },
              textOutput: "— Не рискуйте так, молодой человек. Говорит она Вам. Несколько монет получено."
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => {
                user.coins += (level + 1) * 300;
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
              action: async () => {
                user.coins += (level + 1) * 300;
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
              action: async () => {
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
        filterFunc: () => user.curse
      }
    ].filter(scene => scene.filterFunc()).random({weights: true});


    scene.event = scene.variability[element]
      .filter((e, i) => i <= level && e !== false)
      .random();

    delete scene.variability;

    if (scene.fastFunc){
      scene.fastFunc();
    }

    await scene.event.action();
    let output = scene.event.textOutput.replace(/\{.+?\}/g, (action) => eval(action));

    let
      income = Math.round( [1, 1.7, 0.8, 0.2][element] * (level + 2.5) * (k + 5) ),
      phrase = ["Это птица? Это самолёт! Нет, это штука!", "Вдумайтесь..", "Ученье – свет, а неученье – штука.", "Игрушка!", "Случайности случайны.", "**ШТУКОВИНА**", "Используйте !штука я, чтобы поменять стихию", "Используйте !штука улучшить, чтобы открыть новые события"].random(),
      footerPhrase = ["кубик рубика", "сапог", "звёзду", "снеговика", "зайца", "большой город", "огненную обезьяну", "ананас", "кефир"].random();

    msg.guild.data.coins += income;
    msg.msg({
      title: phrase, 
      description: `Вы помогли серверу — он получил ${Util.ending(income, "коин", "ов", "", "а")}${scene.id === "day" ? "" : "\nЗа это время также произошло интересное событие:"}`,
      color: embedColor,
      author: {iconURL: msg.author.avatarURL(), name: msg.author.username},
      fields: [{name: `Если коротко..`, value: `**${scene.description}**\n⠀`}, {name: `${emoji} ${level + 1} ур.`, value: output}],
      footer: {text: `Скажем так: эта вещь чем-то похожа на ${footerPhrase}..`}
    });
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