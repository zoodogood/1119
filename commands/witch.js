import * as Util from '#src/modules/util.js';
import DataManager from '#src/modules/DataManager.js';
import { Actions } from '#src/modules/ActionManager.js';

class Command {

	async onChatInput(msg, interaction){
    // <a:void:768047066890895360> <a:placeForVoid:780051490357641226> <a:cotik:768047054772502538>

    if (interaction.mention){
      const data = interaction.mention.data;
      msg.msg({title: "<a:cotik:768047054772502538> Друг странного светящегося кота — мой друг", description: `Сегодня Вы просматриваете профиль другого человека. Законно ли это? Конечно законно, он не против.\n${ interaction.mention.username }, использовал котёл ${ data.voidRituals } раз.\nЕго бонус к опыту: ${ (100 * (1.02 ** data.voidRituals)).toFixed(2) }% от котла.\n<a:placeForVoid:780051490357641226>\n\nСъешь ещё этих французких булок, да выпей чаю`, color: "#3d17a0"});
      return;
    }

    let user = interaction.userData;
    let minusVoids = Math.floor(Math.min(2 + user.voidRituals, 20) * (1 - 0.10 * (user.voidPrise ?? 0)));

    const sendVoidOut = () => {
      const description = `Добудьте ещё ${ Util.ending(minusVoids - user.void, "уров", "ней", "ень", "ня")} нестабильности <a:placeForVoid:780051490357641226>\nЧтобы провести ритуал нужно ${  Util.ending(minusVoids, "камн", "ей", "ь", "я") }, а у вас лишь ${ user.void };\nИх можно получить, с низким шансом, открывая ежедневный сундук.\nПроведено ритуалов: ${user.voidRituals}\nКотёл даёт полезные бонусы, а также увеличивает количество опыта.`;
      const footer = {text: ["Интересно, куда делись все ведьмы?", "Правило по использованию номер 5:\nНИКОГДА не используйте это.*", "Неприятности — лучшие друзья странных светящихся котов.", "Берегитесь мяукающих созданий."].random()};
      msg.msg({title: "<a:void:768047066890895360> Не хватает ресурса", description, color: "#3d17a0", footer});
    }

    if (user.void < minusVoids) {
      sendVoidOut();
      return;
    }

    let boiler = await msg.msg({title: "<a:placeForVoid:780051490357641226> Готовы ли вы отдать свои уровни за вечные усиления..?", description: `Потратьте ${ minusVoids } ур. нестабильности, чтобы стать быстрее, сильнее и хитрее.\n~ Повышает заработок опыта на 2%\nПроведено ритуалов: ${ user.voidRituals }\nБонус к опыту: ${ (100 * (1.02 ** user.voidRituals)).toFixed(2) }%\n\nКроме того, вы сможете выбрать одно из трёх сокровищ, дарующих вам неймоверную мощь!\n<a:cotik:768047054772502538>`, color: "#3d17a0"});
    let isHePay = await boiler.awaitReact({user: msg.author, type: "all"}, "768047066890895360");

    if (!isHePay) {
      boiler.msg({title: "Возвращайтесь, когда будете готовы.", description: "Проведение ритуала было отменено", edit: true, color: "#3d17a0"});
      return;
    }

    if (user.void < minusVoids) {
      sendVoidOut();
      boiler.delete();
      return;
    }

    // user.CD_48 = Date.now() + 259200000;
    await Util.sleep(1000);

    // Вы не потеряете нестабильность
    if (  user.voidDouble && Util.random(11) === 1 ){
      minusVoids = 0;
    }

    user.void -= minusVoids;
    user.voidRituals++;

    let double_effects = [
      {
        emoji: "🌀",
        description: "Уменьшает кулдаун получения опыта за сообщение на 0.2с",
        _weight: 100 - (user.voidCooldown * 5 ?? 0),
        filter_func: () => !(user.voidCooldown >= 20),
        action: () => user.voidCooldown = ++user.voidCooldown || 1
      },
      {
        emoji: "🔅",
        description: `Мгновенно получите бонус сундука в размере \`${ Math.min(user.voidRituals * 18 + (user.chestBonus * 2 ?? 0) + 38, 9000) }\``,
        _weight: 50,
        action: () => user.chestBonus = (user.chestBonus ?? 0) + Math.min((user.chestBonus * 2 ?? 0) + user.voidRituals * 18 + 38, 9000)
      },
      {
        emoji: "⚜️",
        description: "Уменьшает цену нестабильности для розжыга котла. (Макс. на 50%)",
        _weight: 5,
        filter_func: () => !(user.voidPrise >= 5),
        action: () => user.voidPrise = ++user.voidPrise || 1
      },
      {
        emoji: "🃏",
        description: "Даёт 9%-ный шанс не потерять уровни нестабильности во время ритуала.",
        _weight: 3,
        filter_func: () => !user.voidDouble,
        action: () => user.voidDouble = 1
      },
      {
        emoji: "🔱",
        description: "Делает ежедневные квесты на 15% сложнее, однако также увеличивает их награду на 30%",
        _weight: 10,
        filter_func: () => !(user.voidQuests >= 5),
        action: () => user.voidQuests = ++user.voidQuests || 1
      },
      {
        emoji: "✨",
        description: `Увеличивает награду коин-сообщений на ${7 + user.voidRituals} ед.`,
        _weight: 35,
        action: () => user.coinsPerMessage = (user.coinsPerMessage ?? 0) + 7 + user.voidRituals
      },
      {
        emoji: "💠",
        description: "Даёт \\*бонуы сундука* каждый раз, когда с помощью перчаток вам удается кого-то ограбить.",
        _weight: 20,
        action: () => user.voidThief = ++user.voidThief || 1
      },
      {
        emoji: "😈",
        description: `Создайте экономических хаос, изменив стоимость клубники на рынке! ${ 7 + Math.floor(5 * Math.sqrt(user.voidRituals)) } коинов в случайную сторону.`,
        _weight: 10,
        action: () => DataManager.data.bot.berrysPrise += 7 + Math.floor(5 * Math.sqrt(user.voidRituals)) * (-1) ** Util.random(1)
      },
      {
        emoji: "🍵",
        description: `Удваивает для вас всякий бонус клевера\nНесколько бонусов складываются`,
        _weight: 5,
        action: () => user.voidMysticClover = ++user.voidMysticClover || 1
      },
      {
        emoji: "📿",
        description: `Получите ${ Math.floor(user.keys / 100) } ур. нестабильности взамен ${user.keys - (user.keys % 100)} ключей.`,
        _weight: 30,
        filter_func: () => user.keys >= 100 && user.chestLevel,
        action: () => {
          user.void += Math.floor(user.keys / 100);
          user.keys = user.keys % 100;
        }
      },
      {
        emoji: "♦️",
        description: `Увеличивает вероятность коин-сообщения на 10%!`,
        _weight: 15,
        filter_func: () => !(user.voidCoins >= 7),
        action: () => user.voidCoins = ~~user.voidCoins + 1
      },
      {
        emoji: "🏵️",
        description: `Улучшает сундук до ${user.chestLevel + 2} уровня. Требует ${user.chestLevel ? 500 : 150} ключей.`,
        _weight: Infinity,
        filter_func: () => user.chestLevel != 2 && user.keys >= (user.chestLevel ? 500 : 150),
        action: () => user.keys -= user.chestLevel++ ? 500 : 150
      },
      {
        emoji: "💖",
        description: `Ваши монстры будут защищать вас от ограблений Воров`,
        _weight: 3,
        filter_func: () => user.monster && !user.voidMonster,
        action: () => user.voidMonster = 1
      },
      {
        emoji: "📕",
        description: `Вы можете брать на одну клубнику больше с дерева. Также при сборе повышает её цену на рынке`,
        _weight: 20,
        filter_func: () => "seed" in user,
        action: () => user.voidTreeFarm = ~~user.voidTreeFarm + 1
      },
      {
        emoji: "🥂",
        description: "Лотерейный билетик из Лавки заменяется настоящим казино",
        _weight: 3,
        filter_func: () => !user.voidCasino,
        action: () => user.voidCasino = 1
      },
      {
        emoji: "🧵",
        description: `Получите случайное количество нестабильности: 1–${ minusVoids * 2 }; Снижает уровень котла на 2.\nЕсли Ваш уровень кратен четырем, Вы получите одну дополнительную нестабильность.`,
        _weight: 2,
        filter_func: () => user.voidRituals > 4,
        action: () => {
          const voids = Util.random(1, minusVoids * 2) + !(user.level % 4);
          user.void += voids;
          user.voidRituals -= 3;
        }
      },
      {
        emoji: "🪸",
        description: `Позволяет иметь более более одного проклятия`,
        _weight: Infinity,
        filter_func: () => !(user.cursesEnded % 10) && !user.voidFreedomCurse,
        action: () => user.voidFreedomCurse = 1
      },
      {
      emoji: "❄️",
        // Хладнокровное одиночество
        description: `Вы получаете на 50% больше опыта и возможность грабить без рисков до момента, пока вас не похвалят, НО вас больше никто не сможет похвалить.`,
        _weight: 1,
        filter_func: () => !user.voidIce && !user.praiseMe || !user.praiseMe.length,
        action: () => {
          user.voidIce = true;
          msg.author.msg({title: "Охлаждение чувств", description: `Вы выполнили секретное достижение\nОписание: \"Променяйте всех знакомых на кучку монет и метод самоутверждения\"\nВозможно вы просто действуете рационально, но все-таки обратного пути больше нет.\nЭто достижение выполнило 0.000% пользователей.`});
        }
      }
    ].filter(e => !e.filter_func || e.filter_func());

    let bonuses = [...new Array(3)].map(() => double_effects.random({pop: true, weights: true}));
    await boiler.msg({title: "<a:placeForVoid:780051490357641226> Выберите второстепенный бонус", description: `Вы можете выбрать всего одно сокровище, хорошенько подумайте, прежде чем что-то взять.\n${bonuses.map(e => e.emoji + " " + e.description).join("\n\n")}`, edit: true, color: "#3d17a0"});

    let react = await boiler.awaitReact({user: msg.author, type: "all"}, ...bonuses.map(e => e.emoji));
    if (!react) react = bonuses.random().emoji;

    bonuses.find(e => e.emoji == react).action();

    boiler.msg({title: "Ритуал завершен..." , description: `Вы выбрали ${react}\nОстальные бонусы более недоступны.\n\n${bonuses.map(e => e.emoji + " " + e.description).join("\n\n")}`, color: "#3d17a0", edit: true});
    await Util.sleep(3000);
    let answer = "";
    const add = (content) => answer = `${content}\n${answer}`;
    switch (user.voidRituals) {
      case 23:
        add("Мы не знаем что произошло дальше. . .");
      break;
      case 22:
        add("...");
      break;
      case 19:
        msg.author.action(Actions.globalQuest, {name: "completeTheGame"});
        add("Но должен ли я остановится? Вселенных, как известно, бесчисленное множество, бесконечность... Поглощая самого себя снова, и снова, мне, возможно, удастся получить ответ. А с приобретенной силой я создам идеальный мир..!")
        add("— Получается я убил их, уничтожил целые вселенные, миры.. Каждый раз я попадая в новую вселенную, заменял собою себя, уничтожая минувший мир. Неужели этого нельзя исправить.. Неужели это конец?");
      case 18:
      case 17:
        add("");
        add("— С каждым днем я ощущаю большую силу, начинаю задумываться о вещах, о которых раньше и слышать не смел. Меня посещают странные мысли, но больше всего меня беспокоит отсутствие беспокойства.");
      case 16:
        add("");
        add("— Прошло не мало времени с последнего ритуала, я всё так же пытаюсь понять что случилось, некоторые мои знакомые стали считать меня сумаcшедшим. Странно, что никто и никогда не видел никаких вспышек в небе, как их можно не заметить? Никак.");
      case 15:
        add("");
        add("Может я сошёл с ума, или я умер, а то что я чувствую это остатки моей самости, её последние воспоминания, которые я вновь и вновь бесконечно чувствую?.. Я не знаю");
        add("Нет, это не мог быть сон! Снова вспоминая каждый огонёк, каждую \"трещину\", рождающуюся в небе, и всё то, странное, что тогда было...");
      case 14:
      case 13:
      case 12:
      case 11:
      case 10:
        add("Размышление о происходящем весь день не покидали вас, чувство беспокойства не позволяло думать о другом.. Мыслями вы снова, и снова возвращаетесь туда, где всё только начиналось.");
      case 9:
      case 8:
      case 7:
      case 6:
      case 5:
        add("Даже ваша собака может подтвердить, что вчера весь день вы были в своей кровати и играли в видео-игры. Как и ваш друг, который тогда выносил вас в танчиках, скажет то же, что и пёс.");
      case 4:
        add("Нет, это не мог быть сон, вспоминая каждый летающий в черном небе огонёк, думаете вы. Но факты говорят обратное..");
      case 3:
      case 2:
        add("");
        add("Всё было такое яркое и красочное..");
      case 1:
        add("Впереди стояла необъяснимо-необъяснимая дверь, за которой виднелась ваша комната. Войдя, вы просыпаетесь на своей кровати, вокруг всё как раньше. Ощущаете себя, как никогда хорошо, но с помутнённым разумом.");
        add("\*Яркая вспышка котла что-то изменила в этом мире, он начал разрушаться.\*");
        break;
      default:
        add("...");

    }
    const title = `День ${Math.round(user.voidRituals ** 2.093 / 1.3)}.`;
    msg.msg({title, description: answer, image: user.voidRituals === 19 ? "https://media.discordapp.net/attachments/629546680840093696/843562906053640202/2.jpg?width=1214&height=683" : "https://media.discordapp.net/attachments/629546680840093696/836122708185317406/mid_250722_922018.jpg", footer: {iconURL: msg.author.avatarURL(), text: msg.author.username}, color: "#000001"});


  }


	options = {
	  "name": "witch",
	  "id": 48,
	  "media": {
	    "description": "\n\nКотелок даёт неплохие бонусы, а так же вводит концовку в боте — используя котёл 20 раз, вы раскроете её, попутно читая небольшой рассказ и уничтожив парочку вселенных.\n\n:pencil2:\n```python\n!witch #без аргументов\n```\n\n"
	  },
	  "allias": "boiler котёл котел ведьма"
	};
};

export default Command;