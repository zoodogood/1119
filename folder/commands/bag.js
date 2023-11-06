import { Actions } from "#lib/modules/ActionManager.js";
import * as Util from "#lib/util.js";

class Item {
  constructor(itemData) {
    this.itemData = itemData;
    const { key, names, ending } = itemData;
    Object.assign(this, { key, names, ending });
  }
  display(...args) {
    return this.itemData.ending(...args);
  }

  // Default getter
  getter({ target }) {
    return target[this.itemData.key];
  }
  setter({ target, count }) {
    return (target[this.itemData.key] = count);
  }

  getLimit() {
    return this.itemData.limit || null;
  }
}

const ITEMS = [
  {
    key: "coins",
    names: ["коина", "коины", "коин", "коинов", "coins", "coin", "c", "к"],
    ending: (count) =>
      `<:coin:637533074879414272> ${Util.ending(count, "Коин", "ов", "", "а")}`,
  },
  {
    key: "exp",
    names: ["опыта", "опыт", "опытов", "exp", "experience"],
    ending: (count) =>
      `<:crys2:763767958559391795> ${Util.ending(count, "Опыт", "а", "", "а")}`,
  },
  {
    key: "chestBonus",
    names: [
      "бонусов",
      "бонус",
      "бонуса",
      "сундука",
      "сундуков",
      "сундук",
      "бонусов сундука",
      "chestbonus",
    ],
    ending: (count) =>
      `<a:chest:805405279326961684> ${Util.ending(
        count,
        "Бонус",
        "ов",
        "",
        "а",
      )} сундука`,
  },
  {
    key: "void",
    names: [
      "нестабильности",
      "нестабильность",
      "void",
      "камень",
      "камней",
      "камня",
    ],
    ending: (count) =>
      `<a:void:768047066890895360> ${Util.ending(
        count,
        "Кам",
        "ней",
        "ень",
        "ня",
      )} нестабильности`,
  },
  {
    key: "berrys",
    names: [
      "клубник",
      "клубники",
      "клубника",
      "клубниу",
      "ягоды",
      "ягод",
      "ягода",
      "berry",
      "berrys",
    ],
    ending: (count) =>
      `<:berry:756114492055617558> ${Util.ending(
        count,
        "Клубник",
        "",
        "а",
        "и",
      )}`,
  },
  {
    key: "chilli",
    names: ["перец", "перцев", "перца", "chilli"],
    ending: (count) => `🌶️ ${Util.ending(count, "Пер", "цев", "ец", "ца")}`,
  },
  {
    key: "monster",
    names: ["монстр", "монстров", "монстра", "monster"],
    ending: (count) => `🐲 ${Util.ending(count, "Монстр", "ов", "", "а")}`,
  },
  {
    key: "thiefGloves",
    names: ["перчатки", "перчатку", "перчатка", "перчаток", "glove", "gloves"],
    ending: () => `🧤 ${Util.ending(count, "Перчат", "ки", "у", "ки")}`,
    display: (count) => `🧤 Перчатки ${count}шт.`,
  },
  {
    key: "keys",
    names: ["ключ", "ключей", "ключа", "ключи", "key"],
    ending: (count) => `🔩 ${Util.ending(count, "Ключ", "ей", "", "а")}`,
  },
  {
    key: "seed",
    names: ["семечко", "семечек", "семян", "семечка", "семячек", "seed"],
    ending: (count) => `🌱 ${Util.ending(count, "Сем", "ян", "ечко", "ечка")}`,
  },
  {
    key: "cheese",
    names: ["сыр", "сыра", "сыров", "cheese", "cheses"],
    ending: (count) => `🧀 ${Util.ending(count, "Сыр", "ов", "", "а")}`,
  },
  {
    key: "iq",
    names: ["iq", "icq", "iqbanana", "айкью"],
    ending: (count) => `<a:iq:768047041053196319> ${count} IQ`,
  },
  {
    key: "coinsPerMessage",
    names: ["коинов за сообщение", "награда коин-сообщений", "coinsPerMessage"],
    ending: (count) =>
      `✨ ${Util.ending(count, "Коин", "ов", "", "а")} за сообщение`,
  },
  {
    key: "voidCooldown",
    names: [
      "уменьшений кулдауна",
      "уменьшение кулдауна",
      "уменьшения кулдауна",
      "voidcooldown",
    ],
    limit: 20,
    ending: (count) => `🌀 ${Util.ending(count, "Бонус", "ов", "", "а")}`,
    display: (count) => `🌀 Бонус "Уменьшение кулдауна" ${count}/20`,
  },
  {
    key: "voidPrice",
    names: ["скидок на котёл", "скидок на котел", "voidprice"],
    limit: 3,
    ending: (count) => `⚜️ ${Util.ending(count, "Бонус", "ов", "", "а")}`,
    display: (count) => `⚜️ Бонус "Скидок на котёл" ${count}/3`,
  },
  {
    key: "voidDouble",
    names: ["нестабилити", "voiddouble"],
    limit: 1,
    ending: (count) => `🃏 ${Util.ending(count, "Бонус", "ов", "", "а")}`,
    display: (count) => `🃏 Бонус "Нестабилити" ${count}/1`,
  },
  {
    key: "voidQuests",
    names: ["усиление квестов", "усиление квеста", "voidquests"],
    limit: 5,
    ending: (count) => `🔱 ${Util.ending(count, "Бонус", "ов", "", "а")}`,
    display: (count) => `🔱 Бонус "Усиление квестов" ${count}/5`,
  },
  {
    key: "voidCoins",
    names: ["шанс коина", "шанс коинов", "voidcoins"],
    limit: 7,
    ending: (count) => `♦️ ${Util.ending(count, "Бонус", "ов", "", "а")}`,
    display: (count) => `♦️ Бонус "Шанс коина" ${count}/7`,
  },
  {
    key: "voidMonster",
    names: ["монстр-защитник", "монстр защитник", "voidmonster"],
    limit: 1,
    ending: (count) => `💖 ${Util.ending(count, "Бонус", "ов", "", "а")}`,
    display: (count) => `💖 Бонус "Монстр-защитник" ${count}/1`,
  },
  {
    key: "voidThief",
    names: ["бонусы от перчаток", "voidthief"],
    ending: (count) => `💠 ${Util.ending(count, "Бонус", "ов", "", "а")}`,
    display: (count) => `💠 Бонус "Бонусы от перчаток" ${count}`,
  },
  {
    key: "voidMysticClover",
    names: [
      "умение заворож. клевер",
      "умение заворожить клевер",
      "заворожение клевера",
      "заворожить клевер",
      "заворожения клевера",
      "voidmysticclover",
    ],
    ending: (count) => `🍵 ${Util.ending(count, "Бонус", "ов", "", "а")}`,
    display: (count) => `🍵 Бонус "Умение заворож. Клевер" ${count}/50`,
  },
  {
    key: "voidTreeFarm",
    names: ["фермер", "фермеров", "фермера", "voidtreefarm"],
    ending: (count) => `📕 ${Util.ending(count, "Бонус", "ов", "", "а")}`,
    display: (count) => `📕 Бонус "Фермер" ${count}`,
  },
  {
    key: "voidCasino",
    names: ["казино", "voidcasino"],
    limit: 1,
    ending: (count) => `🥂 ${Util.ending(count, "Бонус", "ов", "", "а")}`,
    display: (count) => `🥂 Бонус "Казино" ${count}/1`,
  },
];

class Command {
  constructor() {
    this.items = ITEMS.map((itemData) => new Item(itemData));
  }

  getContext(interaction) {
    return {
      interaction,
      userData: interaction.userData,
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      ...this.parseParams(interaction.params),
    };
  }

  parseParams(params) {
    const action = params.match(/взять|take|положить|put/)?.[0];
    const count = params.match(/\d+|\+/)?.[0];
    let item = null;
    let rawItem = null;
    const isPutAction = ["положить", "put"].includes(action);
    const isReceiveAction = ["взять", "take"].includes(action);

    if (action && count) {
      params = params.replace(action, "");
      params = params.replace(count, "");
      rawItem = params = params.trim().toLowerCase();

      item = this.items.find(({ itemData }) =>
        itemData.names.includes(rawItem),
      );
    }
    return { action, count, item, isReceiveAction, isPutAction, rawItem };
  }

  async onChatInput(msg, interaction) {
    if (interaction.mention) {
      msg.msg({
        title:
          "Вы не можете просматривать содержимое сумки у других пользователей",
        color: "#ff0000",
        delete: 15_000,
        description:
          "Попросите человека открыть сумку, чтобы вы смогли увидеть содержимое",
      });
      return;
    }

    const context = this.getContext(interaction);
    const { action, count, item, rawItem, userData } = context;

    interaction.user.action(Actions.beforeBagInteracted, context);
    const needPrevent = context.defaultPrevented;
    if (action && needPrevent) {
      interaction.channel.msg({
        delete: 7_000,
        title: "Взаимодействие с сумкой заблокированно внешним эффектом",
      });
      return;
    }

    if (action && count) {
      if (!item) {
        const list = this.items.reduce(
          (acc, item) => acc.concat(item.names),
          [],
        );
        const similarItem = Util.getSimilar(list, rawItem);
        msg.msg({
          title: "Не удалось найти такой предмет:",
          description: `\`${rawItem}\`${
            similarItem ? `\n\nВозможно, Вы имели ввиду: ${similarItem}?` : ""
          }`,
          delete: 7000,
        });
        return;
      }
    }

    if (item) {
      const isToBag = context.isPutAction;

      if (!userData.bag) userData.bag = {};

      this.moveItem(context, item.key, count, isToBag);
      return;
    }

    this.displayBag(context);
    return;
  }

  displayBag(context) {
    const { userData, interaction } = context;
    const items = Object.entries(userData.bag || {})
      .map(([key, count]) => ({
        itemData: this.items.find((item) => item.key === key),
        count,
      }))
      .filter(({ itemData }) => itemData !== undefined)
      .map(({ itemData, count }) => itemData.display(count))
      .map((str) => `– ${str}`);

    const description = items.length
      ? items.join("\n")
      : "Она пустая!! Гады, положите туда что-нибудь..\n!bag put 1 coin";

    const embed = {
      title: "Сэр, Ваша сумка?",
      description,
      footer: {
        text: `Ты, Сэр ${interaction.user.tag}`,
        iconURL: interaction.user.avatarURL(),
      },
    };
    interaction.channel.msg(embed);
    return;
  }

  moveItem(context, key, count, isToBag) {
    const { userData, interaction } = context;
    const item = this.items.find((item) => item.key === key);
    const targetFrom = isToBag ? userData : userData.bag;
    const targetTo = isToBag ? userData.bag : userData;

    if (count === "+") {
      const value = item.getter({ target: targetFrom });
      count = value || 0;
    }
    count = Math.max(Math.floor(count), 0);

    if (userData[key] === undefined)
      item.setter({ count: 0, target: userData });

    if (userData.bag[key] === undefined)
      item.setter({ count: 0, target: userData.bag });

    const currentCount = item.getter({ target: targetFrom });
    if (currentCount < count) {
      const description = `Надо на ${item.ending(
        count - currentCount,
      )} больше!`;
      interaction.channel.msg({
        title: "Недостаточно ресурса",
        delete: 7000,
        description,
      });
      return;
    }

    if (item.getLimit() && !isToBag) {
      const current = item.getter({ target: targetTo });
      const limit = item.getLimit();
      count = Math.min(count, limit - current);
    }

    item.setter({
      target: targetFrom,
      count: item.getter({ target: targetFrom }) - count,
    });
    item.setter({
      target: targetTo,
      count: item.getter({ target: targetTo }) + count,
    });

    const bagDescription = isToBag
      ? "в а-ля вакуумный объект"
      : "из черной дыры";
    const description = `Вы успешно ${
      isToBag ? "положили" : "взяли"
    } ${item.ending(count)} ${bagDescription}.`;

    interaction.channel.msg({
      title: `Действие с сумка ${interaction.user.tag}`,
      delete: 9000,
      description,
    });
  }

  options = {
    name: "bag",
    id: 58,
    media: {
      description:
        "\n\nНикто кроме владельца не может просматривать содержимое сумки. В неё можно положить любой предмет будь то нестабильность, клубника и даже бонусы\nСумка это альтернатива использования казны как личного хранилища. При этом она всегда под рукой!\n\n✏️\n```python\n!bag <\"take\" | \"put\"> <item> <count | \"+\"> # аргументы могут быть указаны в любом порядке\n```\n\n",
    },
    allias: "сумка рюкзак",
    allowDM: true,
    type: "user",
  };
}

export default Command;
