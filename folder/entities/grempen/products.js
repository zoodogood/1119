import client from "#bot/client.js";
import { ActionsMap } from "#constants/enums/actionsMap.js";
import { HOUR } from "#constants/globals/time.js";
import CurseManager from "#lib/modules/CurseManager.js";
import DataManager from "#lib/modules/DataManager.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import TimeEventsManager from "#lib/modules/TimeEventsManager.js";
import {
  addResource,
  ending,
  random,
  timestampDay,
  transformToCollectionUsingKey,
} from "#lib/util.js";

export const grempen_products = transformToCollectionUsingKey([
  {
    key: "stick",
    label: () => "Просто палка",
    emoji: () => "🦴",
    price: () => 244,
    inline: true,
    others: ["палка", "палку"],
    fn(boughtContext) {
      const { userData, interaction } = boughtContext;
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
    label: () => "Жгучий перчик",
    emoji: () => "🌶️",
    price: () => 160,
    inline: true,
    others: ["перец", "перчик"],
    fn(boughtContext) {
      const { userData, interaction, channel } = boughtContext;
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
    label: () => "Перчатки перчатника",
    emoji: () => "🧤",
    price: () => 700,
    inline: true,
    others: ["перчатку", "перчатки", "перчатка"],
    fn(boughtContext) {
      const { userData, interaction, user } = boughtContext;
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
    label: () => "Старый ключ",
    emoji: () => "🔩",
    price: () => 15,
    inline: true,
    others: ["ключ", "ключик", "key"],
    fn(boughtContext) {
      const { interaction } = boughtContext;
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
    label: () => "Бутылёк опыта",
    emoji: () => "🧪",
    price: () => "???",
    inline: true,
    others: ["опыт", "бутылёк"],
    fn(boughtContext) {
      const { userData, interaction } = boughtContext;
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
    label: () => "Ручной монстр",
    emoji: () => "🐲",
    price: ({ userData }) =>
      1999 + 1000 * Math.ceil((userData.monstersBought || 0) / 3),
    inline: true,
    others: ["монстр", "монстра"],
    fn(boughtContext) {
      const { userData, interaction, channel } = boughtContext;
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
    label: () => "Консервы Интеллекта",
    emoji: () => "🥫",
    price: () => 1200,
    inline: true,
    others: ["консервы", "интеллект"],
    fn(boughtContext) {
      const { userData, interaction } = boughtContext;
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
    label: () => "Бутылка глупости",
    emoji: () => "🍼",
    price: () => 400,
    inline: true,
    others: ["бутылка", "бутылку", "глупость", "глупости"],
    fn(boughtContext) {
      const { userData, interaction } = boughtContext;
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
    label: () => "Шуба из енота",
    emoji: () => "👜",
    price: () => 3200,
    inline: true,
    others: ["шуба", "шубу", "шуба из енота"],
    fn(boughtContext) {
      const { userData, interaction } = boughtContext;
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
      interaction.user.action(ActionsMap.globalQuest, { name: "beEaten" });

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
    label: ({ userData }) =>
      userData.voidCasino ? "Casino" : "Лотерейный билет",
    emoji: ({ userData }) => (userData.voidCasino ? "🥂" : "🎟️"),
    price: ({ userData }) =>
      userData.voidCasino ? Math.floor(userData.coins / 3.33) : 130,
    inline: true,
    others: [
      "билет",
      "лотерея",
      "лотерею",
      "казино",
      "casino",
      "лотерейный билет",
    ],
    fn(boughtContext) {
      const { userData, interaction } = boughtContext;
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
    label: () => "Идея",
    emoji: () => "💡",
    price: ({ userData }) =>
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
    label: () => "Счастливый клевер",
    emoji: () => "☘️",
    price: () => 400,
    inline: true,
    others: ["клевер", "счастливый", "счастливый клевер", "clover"],
    createCloverTimeEvent(guildId, channelId) {
      const endsIn = HOUR * 4;
      return TimeEventsManager.create("clover-end", endsIn, [
        guildId,
        channelId,
      ]);
    },
    fn(boughtContext) {
      const { interaction } = boughtContext;
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
        const adding = Math.floor(HOUR * 4 - (previous - Date.now()) / WEAKING);
        const ms = previous + Math.max(adding, 0);
        return ms;
      };
      const day = timestampDay(clover.timestamp);
      clover.timestamp = increaseTimestamp(clover.timestamp);

      const filter = (event) =>
        event.name === "clover-end" && event._params_as_json.includes(guild.id);

      const event =
        TimeEventsManager.at(day)?.find(filter) ??
        this.createCloverTimeEvent(guild.id, interaction.channel.id);

      TimeEventsManager.update(event, { timestamp: clover.timestamp });
      return phrase;
    },
  },
  {
    key: "ball",
    label: () => "Всевидящий шар",
    emoji: () => "🔮",
    price: () => 8000,
    inline: true,
    others: ["шар", "кубик", "случай", "всевидящий", "ball", "всевидящий шар"],
    fn(boughtContext) {
      const { interaction } = boughtContext;
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
    label: () => "Завоз товаров",
    emoji: () => "🔧",
    price: ({ userData }) => 312 + userData.level * 2,
    inline: true,
    others: ["завоз", "завоз товаров"],
    fn(boughtContext) {
      const { userData } = boughtContext;
      userData.grempenBoughted = 0;
      boughtContext.slots.forEach((slot) => (slot.isBoughted = false));
      return " как дорогостоящий завоз товаров. Заходите ко мне через пару минут за новыми товарами";
    },
  },
  {
    key: "curseStone",
    label: () => "Камень с глазами",
    emoji: () => "👀",
    price: () => 600,
    inline: true,
    others: ["камень", "проклятие", "камень с глазами"],
    fn(boughtContext) {
      const { userData, interaction, user } = boughtContext;
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

        userData.grempenBoughted -= 2 ** boughtContext.slot.index;
        return " как ничто. Ведь вы уже были прокляты!";
      }

      const curse = CurseManager.generate({
        hard: null,
        user,
        context: boughtContext,
      });
      CurseManager.init({ user, curse });
      const descriptionContent = CurseManager.interface({
        user,
        curse,
      }).toString();

      return ` как новое проклятие. Чтобы избавится от бича камня: ${descriptionContent}.`;
    },
  },
]);
