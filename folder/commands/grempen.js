import { BaseCommand } from "#lib/BaseCommand.js";
import { client } from "#bot/client.js";
import CurseManager from "#lib/modules/CurseManager.js";
import DataManager from "#lib/modules/DataManager.js";
import TimeEventsManager from "#lib/modules/TimeEventsManager.js";
import { Actions } from "#lib/modules/ActionManager.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import { DAY, HOUR } from "#constants/globals/time.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import {
  addResource,
  ending,
  joinWithAndSeparator,
  random,
  timestampDay,
  sleep,
} from "#lib/util.js";
import { BaseContext } from "#lib/BaseContext.js";

function get_products(context) {
  const { user, userData, interaction, channel } = context;
  return [
    {
      key: "stick",
      label: "Просто палка",
      emoji: "🦴",
      price: 244,
      inline: true,
      others: ["палка", "палку"],
      fn() {
        const product = this;

        let phrase =
          ".\nВы купили палку. Это самая обычная палка, и вы её выбросили.";
        if (userData.monster) {
          const DENOMINATOR = 0.992;
          const COMMON_VALUE = 3;

          const MIN = 5;

          const max =
            (COMMON_VALUE * (1 - DENOMINATOR ** userData.monster)) /
              (1 - DENOMINATOR) +
            MIN;

          const count = Math.ceil(random(MIN, max));
          phrase += `\nВаши ручные Монстры, погнавшись за ней, нашли ${ending(
            count,
            "ключ",
            "ей",
            "",
            "а",
          )}`;

          addResource({
            user: interaction.user,
            value: count,
            source: "command.grempen.product.stick",
            executor: interaction.user,
            resource: PropertiesEnum.keys,
            context: { interaction, product },
          });
          userData.keys += count;
        }

        return phrase;
      },
    },
    {
      key: "chilli",
      label: "Жгучий перчик",
      emoji: "🌶️",
      price: 160,
      inline: true,
      others: ["перец", "перчик"],
      fn() {
        const product = this;
        if (userData.chilli === undefined) {
          channel.msg({
            title: "Окей, вы купили перец, просто бросьте его...",
            description: "Команда броска `!chilli @Пинг`",
            delete: 12000,
          });
        }

        addResource({
          user: interaction.user,
          value: 1,
          source: "command.grempen.product.chilli",
          executor: interaction.user,
          resource: PropertiesEnum.chilli,
          context: { interaction, product },
        });
        return '. "Готовтесь глупцы, грядёт эра перчиков"';
      },
    },
    {
      key: "gloves",
      label: "Перчатки перчатника",
      emoji: "🧤",
      price: 700,
      inline: true,
      others: ["перчатку", "перчатки", "перчатка"],
      fn() {
        const product = this;
        userData.thiefGloves === undefined &&
          user.msg({
            title: "Вы купили чудо перчатки?",
            description:
              "Отлично, теперь вам доступна команда `!rob`.\n**Правила просты:**\nВаши перчатки позволяют ограбить участника, при условии, что он онлайн.\nВ течении 2-х минут у ограбленного есть возможность догнать вас и вернуть деньги.\nЕсли попадётесь дважды, то перчатки нужно покупать заново — эдакий риск.\nНужно быть осторожным и умным, искать момент.\nА пользователи должны быть хитры, если кто-то спалил, что у вас есть перчатки.\nЦель участников подло заставить Вас на них напасть, а вор, то есть Вы, должен выждать момент и совершить атаку.",
          });

        addResource({
          user: interaction.user,
          value: 2,
          source: "command.grempen.product.gloves",
          executor: interaction.user,
          resource: PropertiesEnum.thiefGloves,
          context: { interaction, product },
        });
        delete userData.CD_39;

        return ". _Режим воровитости активирован._";
      },
    },
    {
      key: "nut",
      label: "Старый ключ",
      emoji: "🔩",
      price: 15,
      inline: true,
      others: ["ключ", "ключик", "key"],
      fn() {
        const product = this;

        addResource({
          user: interaction.user,
          value: 1,
          source: "command.grempen.product.nut",
          executor: interaction.user,
          resource: PropertiesEnum.keys,
          context: { interaction, product },
        });
        return " и что вы делаете? Нет! Это не Фиксик!";
      },
    },
    {
      key: "exp",
      label: "Бутылёк опыта",
      emoji: "🧪",
      price: "???",
      inline: true,
      others: ["опыт", "бутылёк"],
      fn(boughtContext) {
        const product = this;

        const rand = random(3, 7);
        const LIMIT = 15_000;
        const flaconPrice = Math.min(Math.ceil(userData.coins / rand), LIMIT);
        const value = Math.ceil(flaconPrice * 0.2);
        addResource({
          user: interaction.user,
          value,
          source: "command.grempen.product.exp",
          executor: interaction.user,
          resource: PropertiesEnum.exp,
          context: { interaction, product },
        });

        boughtContext.price = flaconPrice;
        return `, как дорогущий флакон давший вам целых ${value} <:crys:637290406958202880>`;
      },
    },
    {
      key: "monster",
      label: "Ручной монстр",
      emoji: "🐲",
      price: 1999 + 1000 * Math.ceil((userData.monstersBought || 0) / 3),
      inline: true,
      others: ["монстр", "монстра"],
      fn() {
        const product = this;

        if (userData.monster === undefined) {
          userData.monster = 0;
          userData.monstersBought = 0;
          channel.msg({
            description:
              "Монстры защищают вас от мелких воришек и больших воров, также они очень любят приносить палку, но не забывайте играть с ними!",
            author: { name: "Информация", iconURL: client.user.avatarURL() },
            delete: 5000,
          });
        }
        addResource({
          user: interaction.user,
          value: 1,
          source: "command.grempen.product.monster",
          executor: interaction.user,
          resource: PropertiesEnum.monster,
          context: { interaction, product },
        });
        addResource({
          user: interaction.user,
          value: 1,
          source: "command.grempen.product.monster",
          executor: interaction.user,
          resource: PropertiesEnum.monstersBought,
          context: { interaction, product },
        });
        return ", ой, простите зверя*";
      },
    },
    {
      key: "cannedFood",
      label: "Консервы Интеллекта",
      emoji: "🥫",
      price: 1200,
      inline: true,
      others: ["консервы", "интеллект"],
      fn() {
        const product = this;

        if (userData.iq === undefined) {
          userData.iq = random(27, 133);
        }

        const value = random(3, 7);
        addResource({
          user: interaction.user,
          value,
          source: "command.grempen.product.cannedFood",
          executor: interaction.user,
          resource: PropertiesEnum.iq,
          context: { interaction, product },
        });

        return ".\nВы едите эти консервы и понимаете, что становитесь умнее. Эта покупка точно была не напрасной...";
      },
    },
    {
      key: "bottle",
      label: "Бутылка глупости",
      emoji: "🍼",
      price: 400,
      inline: true,
      others: ["бутылка", "бутылку", "глупость", "глупости"],
      fn() {
        const product = this;

        if (userData.iq === undefined) {
          userData.iq = random(27, 133);
        }
        const value = random(3, 7);
        addResource({
          user: interaction.user,
          value: -value,
          source: "command.grempen.product.bottle",
          executor: interaction.user,
          resource: PropertiesEnum.iq,
          context: { interaction, product },
        });
        return ".\nГу-гу, га-га?... Пора учится...!";
      },
    },
    {
      key: "coat",
      label: "Шуба из енота",
      emoji: "👜",
      price: 3200,
      inline: true,
      others: ["шуба", "шубу", "шуба из енота"],
      fn(boughtContext) {
        const product = this;

        const isFirst = !(
          userData.questsGlobalCompleted &&
          userData.questsGlobalCompleted.includes("beEaten")
        );
        const refund = boughtContext.price + (isFirst ? 200 : -200);
        addResource({
          user: interaction.user,
          value: refund,
          executor: interaction.user,
          source: "command.grempen.product.coat.refund",
          resource: PropertiesEnum.coins,
          context: { interaction, product },
        });
        interaction.user.action(Actions.globalQuest, { name: "beEaten" });

        if (userData.curses.length > 0) {
          for (const curse of userData.curses) {
            curse.values.timer = -1;
            CurseManager.checkAvailable({ curse, user: interaction.user });
          }
          CurseManager.checkAvailableAll(interaction.user);
          return ", как магический артефакт, досрочно завершивший ваши проклятия";
        }

        return isFirst
          ? ".\nВы надели шубу и в миг были съедены озлобленной группой енотов.\nХорошо, что это был всего-лишь сон, думаете вы...\nНо на всякий случай свою старую шубу из кролика вы выкинули."
          : ".\nВы надели шубу. Она вам очень идёт.";
      },
    },
    {
      key: "casinoTicket",
      label: userData.voidCasino ? "Casino" : "Лотерейный билет",
      emoji: userData.voidCasino ? "🥂" : "🎟️",
      price: userData.voidCasino ? Math.floor(userData.coins / 3.33) : 130,
      inline: true,
      others: [
        "билет",
        "лотерея",
        "лотерею",
        "казино",
        "casino",
        "лотерейный билет",
      ],
      fn() {
        const product = this;

        const coefficient = 220 / 130;
        const bet = userData.voidCasino ? userData.coins * 0.3 : 130;
        const odds = userData.voidCasino ? 22 : 21;
        if (random(odds) > 8) {
          const victory = Math.ceil(bet * coefficient);
          addResource({
            user: interaction.user,
            value: victory,
            executor: interaction.user,
            source: "command.grempen.product.casino",
            resource: PropertiesEnum.coins,
            context: { interaction, bet, product },
          });
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
      key: "idea",
      label: "Идея",
      emoji: "💡",
      price:
        userData.iq &&
        userData.iq % 31 === +DataManager.data.bot.dayDate.match(/\d{1,2}/)[0]
          ? "Бесплатно"
          : 80,
      inline: true,
      others: ["идея", "идею"],
      fn() {
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
      key: "clover",
      label: "Счастливый клевер",
      emoji: "☘️",
      price: 400,
      inline: true,
      others: ["клевер", "счастливый", "счастливый клевер", "clover"],
      createCloverTimeEvent(guildId, channelId) {
        const endsIn = HOUR * 4;
        return TimeEventsManager.create("clover-end", endsIn, [
          guildId,
          channelId,
        ]);
      },
      fn() {
        const phrase =
          ". Клевер для всех участников в течении 4 часов увеличивает награду коин-сообщений на 15%!\nДействует только на этом сервере.";
        const guild = interaction.guild;
        const guildData = guild.data;

        if (!guildData.cloverEffect) {
          guildData.cloverEffect = {
            coins: 0,
            createdAt: Date.now(),
            uses: 1,
            timestamp: null,
          };
          const event = this.createCloverTimeEvent(
            guild.id,
            interaction.channel.id,
          );
          guildData.cloverEffect.timestamp = event.timestamp;
          return phrase;
        }

        const clover = guildData.cloverEffect;
        clover.uses++;

        const increaseTimestamp = (previous) => {
          const WEAKING = 18;
          const adding = Math.floor(
            HOUR * 4 - (previous - Date.now()) / WEAKING,
          );
          const ms = previous + Math.max(adding, 0);
          return ms;
        };
        const day = timestampDay(clover.timestamp);
        clover.timestamp = increaseTimestamp(clover.timestamp);

        const filter = (event) =>
          event.name === "clover-end" &&
          event._params_as_json.includes(guild.id);

        const event =
          TimeEventsManager.at(day)?.find(filter) ??
          this.createCloverTimeEvent(guild.id, interaction.channel.id);

        TimeEventsManager.update(event, { timestamp: clover.timestamp });
        return phrase;
      },
    },
    {
      key: "ball",
      label: "Всевидящий шар",
      emoji: "🔮",
      price: 8000,
      inline: true,
      others: [
        "шар",
        "кубик",
        "случай",
        "всевидящий",
        "ball",
        "всевидящий шар",
      ],
      fn() {
        const product = this;

        const resources = [
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
        const resource = resources.random();
        addResource({
          user: interaction.user,
          value: 1,
          executor: interaction.user,
          source: "command.grempen.product.ball",
          resource,
          context: { interaction, product },
        });

        return ` как \`gachi-${resource}\`, которого у вас прибавилось в количестве один.`;
      },
    },
    {
      key: "renewal",
      label: "Завоз товаров",
      emoji: "🔧",
      price: 312 + userData.level * 2,
      inline: true,
      others: ["завоз", "завоз товаров"],
      fn() {
        userData.grempenBoughted = 0;
        return " как дорогостоящий завоз товаров. Заходите ко мне через пару минут за новыми товарами";
      },
    },
    {
      key: "curseStone",
      label: "Камень с глазами",
      emoji: "👀",
      price: 600,
      inline: true,
      others: ["камень", "проклятие", "камень с глазами"],
      fn(boughtContext) {
        const product = this;
        userData.curses ||= [];

        const already = userData.curses.length;

        if (already && !userData.voidFreedomCurse) {
          addResource({
            user: interaction.user,
            value: boughtContext.price,
            executor: interaction.user,
            source: "command.grempen.product.curse.refund",
            resource: PropertiesEnum.coins,
            context: { interaction, product },
          });

          userData.grempenBoughted -=
            2 ** context.today_products.indexOf(product);
          return " как ничто. Ведь вы уже были прокляты!";
        }

        const { user, guild } = interaction;
        const context = { guild };

        const curse = CurseManager.generate({
          hard: null,
          user,
          context,
        });
        const { description } = CurseManager.cursesBase.get(curse.id);
        CurseManager.init({ user, curse });
        const descriptionContent =
          typeof description === "function"
            ? description(user, curse, context)
            : description;

        return ` как новое проклятие. Чтобы избавится от бича камня: ${descriptionContent}.`;
      },
    },
  ];
}

class Slot {
  constructor(product, price, index) {
    this.product = product;
    this.price = price;
    this.index = index;
  }
  product;
  isBoughted = false;
  index;
  price;
}

class BoughtContext extends BaseContext {
  constructor(commandRunContext, slot) {
    super("command.grempen.bought", commandRunContext);
    this.commandRunContext = commandRunContext;
    this.slot = slot;
    this.product = slot.product;
    this.price = slot.price;
  }
  product;
  price;
  commandRunContext;
  slot;
  phrase;
}
// MARK: TodayProducts
function slotIsBoughted(userData, index) {
  if (index === -1) {
    return false;
  }
  return (userData.grempenBoughted & (2 ** index)) !== 0;
}
class CommandRunContext extends BaseCommandRunContext {
  /**@type {Slot[]} */
  slots = [];
  userData;
  options = {};

  static new(interaction, command) {
    const context = new this(interaction, command);
    context.userData = interaction.user.data;
    return context;
  }
}

async function process_bought(boughtContext) {
  const { slot, commandRunContext } = boughtContext;
  const { product } = slot;
  const { channel, userData, interaction, user } = commandRunContext;

  if (userData.coins < (boughtContext.price || 0)) {
    await channel.msg({
      title: "<:grempen:753287402101014649> Т-Вы что удумали?",
      description: `Недостаточно коинов, ${product.emoji} ${product.label} стоит на ${
        boughtContext.price - userData.coins
      } дороже`,
      color: "#400606",
      delete: 5_000,
    });
    return;
  }

  const phrase = (() => {
    try {
      return product.fn(boughtContext);
    } catch (error) {
      return error;
    }
  })();
  if (phrase instanceof Error) {
    throw phrase;
  }

  boughtContext.phrase = `Благодарю за покупку ${product.emoji} !\nЦена в ${ending(
    !isNaN(boughtContext.price) ? boughtContext.price : 0,
    "монет",
    "",
    "у",
    "ы",
  )} просто ничтожна за такую хорошую вещь${phrase}`;

  if (!isNaN(boughtContext.price)) {
    addResource({
      user: interaction.user,
      value: -boughtContext.price,
      executor: interaction.user,
      source: `command.grempen.bought.${product.key}`,
      resource: PropertiesEnum.coins,
      context: boughtContext,
    });
  }

  if (!boughtContext.commandRunContext.disableSyncSlots) {
    userData.grempenBoughted += 2 ** slot.index;
  }

  interaction.user.action(Actions.buyFromGrempen, boughtContext);
  if (userData.grempenBoughted === 63) {
    interaction.user.action(Actions.globalQuest, { name: "cleanShop" });
  }

  slot.isBoughted = true;

  return channel.msg({
    description: boughtContext.phrase,
    author: { name: user.username, iconURL: user.avatarURL() },
    color: "#400606",
  });
}
class Command extends BaseCommand {
  process_mention(context) {
    const { interaction, channel } = context;
    if (!interaction.mention) {
      return false;
    }
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
      mentionUserData.shopTime === Math.floor(Date.now() / DAY) &&
      mentionUserData.grempenBoughted
        ? `приобрел ${ending(
            list.length,
            "товар",
            "ов",
            "",
            "а",
          )} под номером: ${joinWithAndSeparator(
            list.sort(Math.random),
          )}. Если считать с нуля конечно-же.`
        : "сегодня ничего не приобретал.\nМожет Вы сами желаете чего-нибудь прикупить?";

    const description = `Ох, таки здравствуйте. Человек, о котором Вы спрашиваете ${buyingItemsContent}`;
    channel.msg({
      title: "<:grempen:753287402101014649> Зловещая лавка",
      description,
      color: "#541213",
      thumbnail: interaction.mention.avatarURL(),
    });
    return true;
  }

  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }
  async run(context) {
    const { interaction } = context;
    const { channel, user } = interaction;

    if (this.process_mention(context)) {
      return;
    }

    const { userData } = context;
    const products_list = get_products(context);
    const getTodayItems = () =>
      products_list
        .filter((item) => !item.isSpecial)
        .filter((_item, i) =>
          DataManager.data.bot.grempenItems.includes(i.toString(16)),
        );

    context.slots.push(
      ...(context.options.slots ||
        getTodayItems().map(
          (product, index) => new Slot(product, product.price, index),
        )),
    );

    !context.disableSyncSlots &&
      context.slots.forEach((slot, index) => {
        slotIsBoughted(userData, index) && (slot.isBoughted = true);
      });

    const today_products = getTodayItems();
    context.today_products = today_products;

    if (Math.floor(Date.now() / DAY) !== userData.shopTime) {
      userData.grempenBoughted = 0;
      userData.shopTime = Math.floor(Date.now() / DAY);
    }

    const buyFunc = async (index) => {
      const slot = context.slots[index];

      const contextBought = new BoughtContext(context, slot);
      await process_bought(contextBought);
    };

    if (interaction.params) {
      const target = interaction.params.toLowerCase();
      const index = context.slots.findIndex(
        (slot) =>
          slot.product.label.includes(target) ||
          slot.product.others.includes(target),
      );
      const slot = context.slots[index];
      if (!slot || slot.isBoughted) {
        const product = slot?.product;
        const emoji = product ? product.emoji : "👺";
        const today_available = context.slots
          .filter((slot) => !slot.isBoughted)
          .map(({ product }) => product.emoji)
          .join(" ");

        await channel.msg({
          title: "<:grempen:753287402101014649> Упс!",
          description: `**Сегодня этот предмет (${emoji}) отсуствует в лавке.**\nЖелаете взлянуть на другие товары?\n${today_available}`,
          color: "#400606",
          delete: 8000,
        });
        return;
      }
      await buyFunc(index);
      return;
    }

    if (userData.coins < 80) {
      interaction.channel.sendTyping();
      await sleep(1700);
      return channel.msg({
        title: "<:grempen:753287402101014649>",
        description: "Изыди бездомный попрошайка\nбез денег не возвращайся!",
        color: "#541213",
        delete: 3000,
      });
    }

    const slots_to_fields = () => {
      return context.slots.map((slot) => {
        const { product } = slot;
        const name = `${product.emoji} ${product.label}`;
        let { price: value } = product;

        if (slot.isBoughted) {
          value = "Куплено";
        }

        return { name, value, inline: true };
      });
    };

    let embed = {
      title: "<:grempen:753287402101014649> Зловещая лавка",
      description: `Добро пожаловать в мою лавку, меня зовут Гремпленс и сегодня у нас скидки!\nО, вижу у вас есть **${userData.coins}** <:coin:637533074879414272>, не желаете ли чего нибудь приобрести?`,
      fields: slots_to_fields(),
      color: "#400606",
      footer: { text: "Только сегодня, самые горячие цены!" },
    };
    const shop = await interaction.channel.msg(embed);

    let react;
    while (true) {
      let reactions = context.slots
        .filter(
          (slot) =>
            !slot.isBoughted &&
            (isNaN(slot.price) || slot.price <= userData.coins),
        )
        .map(({ product }) => product.emoji);
      if (reactions.length === 0) reactions = ["❌"];

      react = await shop.awaitReact(
        { user: user, removeType: "all" },
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

      const product = products_list.find((product) => product.emoji === react);
      await buyFunc(
        context.slots.findIndex((slot) => slot.product === product),
      );

      if (userData.coins < 80) {
        channel.sendTyping();
        await sleep(1200);

        shop.msg({
          title: "У вас ещё остались коины? Нет? Ну и проваливайте!",
          edit: true,
          delete: 3_500,
        });
        return;
      }
      embed = {
        title: "<:grempen:753287402101014649> Зловещая лавка",
        edit: true,
        description: `У вас есть-остались коины? Отлично! **${userData.coins}** <:coin:637533074879414272> хватит, чтобы прикупить чего-нибудь ещё!`,
        fields: slots_to_fields(),
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
        "Лавка бесполезных вещей, цены которых невероятно завышены, на удивление, заведение имеет хорошую репутацию и постоянных клиентов.",
      example: `!grempen #без аргументов`,
    },
    alias:
      "гремпленс гремпенс evil_shop зловещая_лавка hell лавка grempens shop шалун ґремпенс крамниця магазин",
    allowDM: true,
    cooldown: 2_000,
    cooldownTry: 2,
    type: "other",
    myChannelPermissions: 8256n,
  };
}

export default Command;
