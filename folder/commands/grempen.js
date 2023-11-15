import * as Util from "#lib/util.js";
import { client } from "#bot/client.js";
import CurseManager from "#lib/modules/CurseManager.js";
import DataManager from "#lib/modules/DataManager.js";
import TimeEventsManager from "#lib/modules/TimeEventsManager.js";
import { Actions } from "#lib/modules/ActionManager.js";

class Command {
  async onChatInput(msg, interaction) {
    if (interaction.mention) {
      const mentionUserData = interaction.mention.data;
      const wordNumbers = [
        "ноль",
        "один",
        "два",
        "три",
        "четыре",
        "пять",
        "шесть",
        "семь",
        "восемь",
        "девять",
        "десять",
      ];

      const getList = (mask) =>
        wordNumbers.filter((word, index) => (2 ** index) & mask);

      const list = getList(mentionUserData.grempenBoughted || 0);

      const buyingItemsContent =
        mentionUserData.shopTime === Math.floor(Date.now() / 86400000) &&
        mentionUserData.grempenBoughted
          ? `приобрел ${Util.ending(
              list.length,
              "товар",
              "ов",
              "",
              "а",
            )} под номером: ${Util.joinWithAndSeparator(
              list.sort(Math.random),
            )}. Если считать с нуля конечно-же.`
          : "сегодня ничего не приобретал.\nМожет Вы сами желаете чего-нибудь прикупить?";

      const description = `Ох, таки здравствуйте. Человек, о котором Вы спрашиваете ${buyingItemsContent}`;
      msg.msg({
        title: "<:grempen:753287402101014649> Зловещая лавка",
        description,
        color: "#541213",
        thumbnail: interaction.mention.avatarURL(),
      });
      return;
    }

    const userData = interaction.user.data;

    const allItems = [
      {
        name: "🦴 Просто палка",
        value: 244,
        inline: true,
        others: ["палка", "палку"],
        fn: () => {
          let phrase =
            ".\nВы купили палку. Это самая обычная палка, и вы её выбросили.";
          if (userData.monster) {
            const DENOMINATOR = 0.995;
            const COMMON_VALUE = 3;

            const MIN = 5;

            const max =
              (COMMON_VALUE * (1 - DENOMINATOR ** userData.monster)) /
                (1 - DENOMINATOR) +
              MIN;
            const count = Math.ceil(Util.random(MIN, max));
            phrase += `\nВаши ручные Монстры, погнавшись за ней, нашли ${Util.ending(
              count,
              "ключ",
              "ей",
              "",
              "а",
            )}`;
            userData.keys += count;
          }

          return phrase;
        },
      },
      {
        name: "🌶️ Жгучий перчик",
        value: 160,
        inline: true,
        others: ["перец", "перчик"],
        fn: () => {
          if (userData.chilli === undefined) {
            userData.chilli = 0;
            msg.msg({
              title: "Окей, вы купили перец, просто бросьте его...",
              description: "Команда броска `!chilli @Пинг`",
              delete: 12000,
            });
          }

          userData.chilli++;
          return '. "Готовтесь глупцы, грядёт эра перчиков"';
        },
      },
      {
        name: "🧤 Перчатки перчатника",
        value: 700,
        inline: true,
        others: ["перчатку", "перчатки", "перчатка"],
        fn: () => {
          if (userData.thiefGloves) {
            userData.thiefGloves += 2;
            delete userData.CD_39;
          } else {
            userData.thiefGloves = 2;
            msg.author.msg({
              title: "Вы купили чудо перчатки?",
              description:
                "Отлично, теперь вам доступна команда `!rob`.\n**Правила просты:**\nВаши перчатки позволяют ограбить участника, при условии, что он онлайн.\nВ течении 2-х минут у ограбленного есть возможность догнать вас и вернуть деньги.\nЕсли попадётесь дважды, то перчатки нужно покупать заново — эдакий риск.\nНужно быть осторожным и умным, искать момент.\nА пользователи должны быть хитры, если кто-то спалил, что у вас есть перчатки.\nЦель участников подло заставить Вас на них напасть, а вор, то есть Вы, должен выждать момент и совершить атаку.",
            });
          }
          return ". _Режим воровитости активирован._";
        },
      },
      {
        name: "🔩 Старый ключ",
        value: 15,
        inline: true,
        others: ["ключ", "ключик", "key"],
        fn: () => {
          userData.keys++;
          return " и что вы делаете? Нет! Это не Фиксик!";
        },
      },
      {
        name: "🧪 Бутылёк опыта",
        value: "???",
        inline: true,
        others: ["опыт", "бутылёк"],
        fn: (product) => {
          const rand = Util.random(3, 7);
          const LIMIT = 15_000;
          const flaconPrice = Math.min(Math.ceil(userData.coins / rand), LIMIT);
          userData.exp += Math.ceil(flaconPrice * 0.8);

          product.value = flaconPrice;
          return `, как дорогущий флакон давший вам целых ${Math.floor(
            flaconPrice * 0.8,
          )} <:crys:637290406958202880>`;
        },
      },
      {
        name: "🐲 Ручной монстр",
        value: 1999 + 1000 * Math.ceil((userData.monstersBought || 0) / 3),
        inline: true,
        others: ["монстр", "монстра"],
        fn: () => {
          if (userData.monster === undefined) {
            userData.monster = 0;
            userData.monstersBought = 0;
            msg.msg({
              description:
                "Монстры защищают вас от мелких воришек и больших воров, также они очень любят приносить палку, но не забывайте играть с ними!",
              author: { name: "Информация", iconURL: client.user.avatarURL() },
              delete: 5000,
            });
          }
          userData.monster++;
          userData.monstersBought++;
          return ", ой, простите зверя*";
        },
      },
      {
        name: "🥫 Консервы Интеллекта",
        value: 1200,
        inline: true,
        others: ["консервы", "интеллект"],
        fn: () => {
          if (userData.iq === undefined) {
            userData.iq = Util.random(27, 133);
          }

          userData.iq += Util.random(3, 7);
          return ".\nВы едите эти консервы и понимаете, что становитесь умнее. Эта покупка точно была не напрасной...";
        },
      },
      {
        name: "🍼 Бутылка глупости",
        value: 400,
        inline: true,
        others: ["бутылка", "бутылку", "глупость", "глупости"],
        fn: () => {
          if (userData.iq === undefined) {
            userData.iq = Util.random(27, 133);
          }

          userData.iq -= Util.random(3, 7);
          return ".\nГу-гу, га-га?... Пора учится...!";
        },
      },
      {
        name: "👜 Шуба из енота",
        value: 3200,
        inline: true,
        others: ["шуба", "шубу", "шуба из енота"],
        fn: (product) => {
          const isFirst = !(
            userData.questsGlobalCompleted &&
            userData.questsGlobalCompleted.includes("beEaten")
          );
          userData.coins += product.value + (isFirst ? 200 : -200);
          interaction.user.action(Actions.globalQuest, { name: "beEaten" });

          if (userData.curses.length > 0) {
            delete userData.curses;
            return ", как магический артефакт, защитивший вас от проклятия";
          }

          return isFirst
            ? ".\nВы надели шубу и в миг были съедены озлобленной группой енотов.\nХорошо, что это был всего-лишь сон, думаете вы...\nНо на всякий случай свою старую шубу из кролика вы выкинули."
            : ".\nВы надели шубу. Она вам очень идёт.";
        },
      },
      {
        name: userData.voidCasino ? "🥂 Casino" : "🎟️ Лотерейный билет",
        value: userData.voidCasino ? Math.floor(userData.coins / 3.33) : 130,
        inline: true,
        others: [
          "билет",
          "лотерея",
          "лотерею",
          "казино",
          "casino",
          "лотерейный билет",
        ],
        fn: () => {
          const coefficient = 220 / 130;
          const bet = userData.voidCasino ? userData.coins * 0.3 : 130;
          const odds = userData.voidCasino ? 22 : 21;
          if (Util.random(odds) > 8) {
            const victory = Math.ceil(bet * coefficient);
            userData.coins += victory;
            return userData.voidCasino
              ? `. Куш получен! — ${victory}`
              : ", ведь с помощью неё вы выиграли 220 <:coin:637533074879414272>!";
          }

          return userData.voidCasino
            ? ". Проигрыш. Возьмёте реванш в следующий раз."
            : ", как бумажка для протирания. Вы проиграли 🤪";
        },
      },
      {
        name: "💡 Идея",
        value:
          userData.iq &&
          userData.iq % 31 === +DataManager.data.bot.dayDate.match(/\d{1,2}/)[0]
            ? "Бесплатно"
            : 80,
        inline: true,
        others: ["идея", "идею"],
        fn: (product) => {
          const ideas = [
            "познать мир шаблонов",
            "купить что-то в этой лавке",
            "начать собирать ключики",
            "занятся чем-то полезным",
            "предложить идею разработчику",
            "заглянуть в сундук",
            "улучшить свой сервер",
            "завести котиков",
            "выпить содовую или может быть... пива?",
            "придумать идею",
            "провести турнир по перчикам",
            "осознать, что автор оставляет здесь пасхалки",
            "купить шубу",
            "отдохнуть",
            "сделать доброе дело",
            "накормить зло добротой",
            "посмотреть в окно",
            "хорошенько покушать",
            "улыбнуться",
            "расшифровать формулу любви",
            "разогнаться до скорости Infinity Train",
            "пройти призрака",
            "з'їсти кого-небудь",
            "предложить разработчику посмотреть хороший фильм",
            "полюбить?",
            "вернуть мне веру в себя",
            "\\*мне стоит оставлять здесь больше пасхалок\\*",
            "понять — проклятья — это не страшно",
          ];
          const phrase = [
            "звучит слишком неубедительно",
            "печенье...",
            "зачем вам всё это надо.",
            "лучше хорошенько выспитесь.",
            "лучше займитесь ничем.",
            "занятся ничегонеделанием всё-равно лучше.",
          ].random();
          return `.\n**Идея:** Вы могли бы ${ideas.random()}, но ${phrase}`;
        },
      },
      {
        name: "☘️ Счастливый клевер",
        value: 400,
        inline: true,
        others: ["клевер", "счастливый", "счастливый клевер", "clover"],
        fn: (product) => {
          const phrase =
            ". Клевер для всех участников в течении 4 часов увеличивает награду коин-сообщений на 15%!\nДействует только на этом сервере.";
          const guild = interaction.guild;
          const guildData = guild.data;

          if (!guildData.cloverEffect) {
            guildData.cloverEffect = {
              coins: 0,
              timestamp: Date.now(),
              uses: 1,
            };
            TimeEventsManager.create("clover-end", 14400000, [
              guild.id,
              interaction.channel.id,
            ]);
            return phrase;
          }

          const clover = guildData.cloverEffect;
          clover.uses++;

          const increaseTimestamp = (timestamp) => {
            const adding = Math.floor(
              14_400_000 - (timestamp - Date.now()) / 18,
            );
            const ms = timestamp + Math.max(adding, 0);
            return ms;
          };
          const day = TimeEventsManager.Util.timestampDay(clover.timestamp);
          clover.timestamp = increaseTimestamp(clover.timestamp);

          const filter = (event) =>
            event.name === "cloverEnd" && event.params.includes(guild.id);
          const event = TimeEventsManager.at(day).find(filter);
          TimeEventsManager.change(event, { timestamp: clover.timestamp });
          return phrase;
        },
      },
      {
        name: "🔮 Всевидящий шар",
        value: 8000,
        inline: true,
        others: [
          "шар",
          "кубик",
          "случай",
          "всевидящий",
          "ball",
          "всевидящий шар",
        ],
        fn: (product) => {
          const items = [
            "void",
            "seed",
            "coins",
            "level",
            "exp",
            "coinsPerMessage",
            "chilli",
            "key",
            "monster",
            "berrys",
            "iq",
            "chestBonus",
          ];
          const item = items.random();
          interaction.user.action(Actions.resourceChange, {
            value: 1,
            executor: interaction.user,
            source: "command.grempen.product.ball",
            resource: item,
            context: { interaction },
          });
          userData[item] = (userData[item] ?? 0) + 1;
          return ` как \`gachi-${item}\`, которого у вас прибавилось в количестве один.`;
        },
      },
      {
        name: "🔧 Завоз товаров",
        value: 312 + userData.level * 2,
        inline: true,
        others: ["завоз", "завоз товаров"],
        fn: (product) => {
          userData.grempenBoughted = 0;
          return " как дорогостоящий завоз товаров. Заходите ко мне через пару минут за новыми товарами";
        },
      },
      {
        name: "👀 Камень с глазами",
        value: 600,
        inline: true,
        others: ["камень", "проклятие", "камень с глазами"],
        fn: (product) => {
          if (!userData.curses) {
            userData.curses = [];
          }

          const already = userData.curses.length;

          if (already && !userData.voidFreedomCurse) {
            userData.coins += product.value;
            userData.grempenBoughted -= 2 ** todayItems.indexOf(product);
            return " как ничто. Ведь вы уже были прокляты!";
          }

          const curse = CurseManager.generate({
            hard: null,
            user: interaction.user,
            guild: interaction.guild,
          });
          const curseBase = CurseManager.cursesBase.get(curse.id);
          CurseManager.init({ user: interaction.user, curse });

          return ` как новое проклятие. Чтобы избавится от бича камня: ${curseBase.description}.`;
        },
      },
    ];

    const getTodayItems = () =>
      allItems.filter((e, i) =>
        DataManager.data.bot.grempenItems.includes(i.toString(16)),
      );

    const todayItems = getTodayItems();

    if (Math.floor(Date.now() / 86400000) !== userData.shopTime) {
      userData.grempenBoughted = 0;
      userData.shopTime = Math.floor(Date.now() / 86400000);
    }

    const isBought = (product) => {
      const index = todayItems.indexOf(product);
      if (index === -1) return null;

      return (userData.grempenBoughted & (2 ** index)) !== 0;
    };

    const buyFunc = async (name) => {
      const product = allItems.find(
        (item) => item.name === name || item.others.includes(name),
      );

      if (!product || isBought(product) !== false) {
        const emoji = product ? product.name.split(" ")[0] : "👺";
        const itemList = todayItems
          .filter((item) => item !== product)
          .map((item) => item.name.split(" ")[0])
          .join(" ");
        await msg.msg({
          title: "<:grempen:753287402101014649> Упс!",
          description: `**Сегодня этот предмет (${emoji}) отсуствует в лавке.**\nЖелаете взлянуть на другие товары?\n${itemList}`,
          color: "#400606",
          delete: 8000,
        });
        return;
      }

      if (userData.coins < (product.value || 0)) {
        await msg.msg({
          title: "<:grempen:753287402101014649> Т-Вы что удумали?",
          description: `Недостаточно коинов, ${product.name} стоит на ${
            product.value - userData.coins
          } дороже`,
          color: "#400606",
          delete: 5000,
        });
        return;
      }

      const phrase = product.fn(product);

      if (!isNaN(product.value)) userData.coins -= product.value;

      userData.grempenBoughted += 2 ** todayItems.indexOf(product);
      interaction.user.action(Actions.buyFromGrempen, {
        product,
        channel: interaction.channel,
      });
      if (userData.grempenBoughted === 63) {
        interaction.user.action(Actions.globalQuest, { name: "cleanShop" });
      }

      return msg.msg({
        description: `Благодарю за покупку ${
          product.name.split(" ")[0]
        } !\nЦена в ${Util.ending(
          product.value,
          "монет",
          "",
          "у",
          "ы",
        )} просто ничтожна за такую хорошую вещь${phrase}`,
        author: { name: msg.author.username, iconURL: msg.author.avatarURL() },
        color: "#400606",
      });
    };

    if (interaction.params) {
      buyFunc(interaction.params.toLowerCase());
      return;
    }

    if (userData.coins < 80) {
      interaction.channel.sendTyping();
      await Util.sleep(1700);
      return msg.msg({
        title: "<:grempen:753287402101014649>",
        description: "Изыди бездомный попрошайка\nбез денег не возвращайся!",
        color: "#541213",
        delete: 3000,
      });
    }

    const productsToFields = () => {
      const list = todayItems.map((item) => {
        const { name } = item;
        let { value } = item;

        if (isBought(item)) {
          value = "Куплено";
        }

        return { name, value, inline: true };
      });

      return list;
    };

    let embed = {
      title: "<:grempen:753287402101014649> Зловещая лавка",
      description: `Добро пожаловать в мою лавку, меня зовут Гремпленс и сегодня у нас скидки!\nО, вижу у вас есть **${userData.coins}** <:coin:637533074879414272>, не желаете ли чего нибудь приобрести?`,
      fields: productsToFields(),
      color: "#400606",
      footer: { text: "Только сегодня, самые горячие цены!" },
    };
    const shop = await interaction.channel.msg(embed);

    let react;
    while (true) {
      let reactions = todayItems
        .filter(
          (item) =>
            isBought(item) === false &&
            (isNaN(item.value) || item.value <= userData.coins),
        )
        .map((item) => item.name.split(" ")[0]);
      if (reactions.length === 0) reactions = ["❌"];

      react = await shop.awaitReact(
        { user: msg.author, removeType: "all" },
        ...reactions,
      );

      if (!react || react === "❌") {
        await shop.reactions.removeAll();
        await shop.msg({
          title: "Лавка закрыта, приходите ещё <:grempen:753287402101014649>",
          edit: true,
          color: "#400606",
          description:
            "Чтобы открыть её снова, введите команду `!grempen`, новые товары появляются каждый день.",
          image:
            "https://cdn.discordapp.com/attachments/629546680840093696/847381047939432478/grempen.png",
        });
        return;
      }

      const product = allItems.find(
        (item) => item.name.split(" ")[0] === react,
      );
      buyFunc(product.name);

      if (userData.coins < 80) {
        msg.channel.sendTyping();
        await Util.sleep(1200);

        shop.msg({
          title: "У вас ещё остались коины? Нет? Ну и проваливайте!",
          edit: true,
          delete: 3000,
        });
        return;
      }
      embed = {
        title: "<:grempen:753287402101014649> Зловещая лавка",
        edit: true,
        description: `У вас есть-остались коины? Отлично! **${userData.coins}** <:coin:637533074879414272> хватит, чтобы прикупить чего-нибудь ещё!`,
        fields: productsToFields(),
        footer: { text: "Приходите ещё, акции каждый день!" },
        color: "#400606",
      };
      await shop.msg(embed);
    }
  }

  options = {
    name: "grempen",
    id: 25,
    media: {
      description:
        "\n\nЛавка бесполезных вещей, цены которых невероятно завышены, на удивление, заведение имеет хорошую репутацию и постоянных клиентов.\n\n✏️\n```python\n!grempen #без аргументов\n```\n\n",
    },
    allias:
      "гремпленс гремпенс evil_shop зловещая_лавка hell лавка grempens shop шалун ґремпенс крамниця",
    allowDM: true,
    cooldown: 10_000,
    type: "other",
  };
}

export default Command;
