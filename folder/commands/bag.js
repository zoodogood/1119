import { Emoji } from "#constants/emojis.js";
import { NEW_YEAR_DAY_DATE } from "#constants/globals/time.js";
import { Actions } from "#lib/modules/ActionManager.js";
import { PropertiesEnum, PropertiesList } from "#lib/modules/Properties.js";
import * as Util from "#lib/util.js";

class Item {
  static from(itemData) {
    const item = Object.assign(Object.create(this.prototype), itemData);
    this.normalize(item);
    return item;
  }

  static normalize(item) {
    item.names = [...item.names].map((alias) => alias.toLowerCase());
  }

  display(...args) {
    return this.ending(...args);
  }
  // Default getter
  getter({ target }) {
    return target[this.key];
  }
  setter({ target, count }) {
    return (target[this.key] = count);
  }

  getLimit() {
    return this.limit || null;
  }
}

const ITEMS = [
  {
    key: "coins",
    names: PropertiesList.coins.alias.split(" "),
    ending: (count) =>
      `<:coin:637533074879414272> ${Util.ending(count, "Коин", "ов", "", "а")}`,
    onUse({ count }) {
      const phrase = `Вы вернули свои ${this.findItemByKey(
        PropertiesEnum.coins,
      ).ending(count)}`;

      return { phrase };
    },
  },
  {
    key: "exp",
    names: PropertiesList.exp.alias.split(" "),
    ending: (count) =>
      `<:crys2:763767958559391795> ${Util.ending(count, "Опыт", "а", "", "а")}`,
  },
  {
    key: "chestBonus",
    names: PropertiesList.chestBonus.alias.split(" "),
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
    names: PropertiesList.void.alias.split(" "),
    onUse({ count, context }) {
      const used = count;

      const MULTIPLAYER = 2;
      const randomized = Util.random(1);
      const { user } = context;
      if (randomized === 1) {
        Util.addResource({
          resource: PropertiesEnum.void,
          user,
          context,
          executor: user,
          source: "command.bag.item.use.void",
          value: count * MULTIPLAYER,
        });
      }
      const phrase = `Шаурма ты. ${randomized ? "+" : "-"} ${
        randomized ? count * MULTIPLAYER : count
      }`;
      return { phrase, used };
    },
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
    names: PropertiesList.berrys.alias.split(" "),
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
    names: PropertiesList.chilli.alias.split(" "),
    ending: (count) => `🌶️ ${Util.ending(count, "Пер", "цев", "ец", "ца")}`,
  },
  {
    key: "monster",
    names: PropertiesList.monster.alias.split(" "),
    ending: (count) => `🐲 ${Util.ending(count, "Монстр", "ов", "", "а")}`,
  },
  {
    key: "thiefGloves",
    names: PropertiesList.thiefGloves.alias.split(" "),
    ending: (count) => `🧤 ${Util.ending(count, "Перчат", "ки", "у", "ки")}`,
    display: (count) => `🧤 Перчатки ${count}шт.`,
  },
  {
    key: "keys",
    names: PropertiesList.keys.alias.split(" "),
    ending: (count) => `🔩 ${Util.ending(count, "Ключ", "ей", "", "а")}`,
  },
  {
    key: "seed",
    names: PropertiesList.seed.alias.split(" "),
    ending: (count) => `🌱 ${Util.ending(count, "Сем", "ян", "ечко", "ечка")}`,
  },
  {
    key: "presents",
    names: PropertiesList.presents.alias.split(" "),
    ending: (count) => `🎁 ${Util.ending(count, "Подар", "ков", "ок", "ка")}`,
    onUse({ context }) {
      const { interaction } = context;
      interaction.channel.msg({
        content: `Введите !подарок, чтобы открыть, только при наличии праздничного проклятия, иначе ничего не получится. Это проклятие можно получить ${NEW_YEAR_DAY_DATE}, отправляя сообщения`,
      });
    },
  },
  {
    key: "cheese",
    names: PropertiesList.cheese.alias.split(" "),
    ending: (count) => `🧀 ${Util.ending(count, "Сыр", "ов", "", "а")}`,
  },
  {
    key: "snowyTree",
    names: ["snowy", "новогоднее"],
    ending: (count) => `${Emoji.snowyTree.toString()} ${count} SnowyTree`,
  },
  {
    key: "iq",
    names: ["iq", "icq", "iqbanana", "айкью"],
    ending: (count) => `<a:iq:768047041053196319> ${count} IQ`,
  },
  {
    key: "coinsPerMessage",
    names: [
      "коинов за сообщение",
      "награда коин-сообщений",
      "coinsPerMessages",
    ],
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
  {
    key: "voidCasino",
    names: ["казино", "voidcasino"],
    limit: 1,
    ending: (count) => `🥂 ${Util.ending(count, "Бонус", "ов", "", "а")}`,
    display: (count) => `🥂 Бонус "Казино" ${count}/1`,
  },
  {
    key: PropertiesEnum.lollipops,
    names: PropertiesList.lollipops.alias.split(" "),
    ending: (count) => `🍭 ${Util.ending(count, "Леден", "цов", "ец", "ца")}`,
    async onUse({ context }) {
      const { guild } = context;
      const today = Util.timestampDay(Date.now());
      const boss = guild.data.boss;

      const BossManager = (await import("#lib/modules/BossManager.js")).default;
      if (BossManager.isArrivedIn(guild) || boss?.apparanceAtDay - 3 > today) {
        const phrase =
          "Вы можете применить этот предмет в момент отсутствия босса на сервере, но не за 3 дня до его появления";
        return { phrase };
      }

      const used = 1;
      const phrase = "Использован леденец, чтобы вызвать босса на одни сутки";

      ((previous) => {
        const previousApparanceDate = previous?.apparanceAtDay;
        const boss = BossManager.summonBoss(guild);
        boss.endingAtDay = today + 1;
        boss.apparanceAtDay = previousApparanceDate || boss.apparanceAtDay;
        boss.avatarURL = BossManager.Speacial.AVATAR_OF_SNOW_QUEEN;
        boss.elementType = BossManager.BOSS_TYPES.get("wind").type;
        boss.level = Util.random(5, 30);
        boss.healthThresholder = BossManager.calculateHealthPointThresholder(
          boss.level,
        );
      })(boss);

      return { used, phrase };
    },
  },
];

class CommandUtil {
  static summarizeInInventoryAndBag({ user, key }) {
    const userData = user.data;
    return (+userData[key] || 0) + (+userData.bag?.[key] || 0);
  }

  static isPointerAll(target) {
    return target === "+";
  }

  static addResourceAndMoveToBag({
    user,
    resource,
    value,
    source,
    executor,
    context,
  }) {
    Util.addResource({
      resource,
      user,
      value,
      source,
      context,
      executor,
    });

    this.moveToBagBrute({ key: resource, count: value, user });
  }

  static moveToBagBrute({ key, count, user }) {
    const bag = CommandUtil.getBagTargetOf(user);
    user.data[key] -= count;
    bag[key] ||= 0;
    bag[key] += count;
  }

  static getBagTargetOf(user) {
    const userData = user.data;
    userData.bag ||= {};
    return userData.bag;
  }
}

class Command {
  static CommandUtil = CommandUtil;

  constructor() {
    this.items = ITEMS.map((itemData) => Item.from(itemData));
  }

  findItemByalias(alias) {
    return this.items.find((item) => item.names.includes(alias.toLowerCase()));
  }

  findItemByKey(key) {
    return this.items.find(
      (item) => item.key.toLowerCase() === key.toLowerCase(),
    );
  }

  findItem(item) {
    return this.findItemByKey(item) || this.findItemByalias(item);
  }

  getContext(interaction) {
    return {
      interaction,
      user: interaction.user,
      guild: interaction.guild,
      userData: interaction.userData,
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      ...this.parseParams(interaction.params),
    };
  }

  async onActionUseItem(context) {
    const { item, interaction, userData, user } = context;
    if (!item.onUse) {
      interaction.channel.msg({
        reference: interaction.message.id,
        content: "У этого предмета нет использования через сумку",
      });
      return;
    }

    const { key } = item;
    const userResourceCount = CommandUtil.summarizeInInventoryAndBag({
      user,
      key,
    });
    const count = CommandUtil.isPointerAll(context.count)
      ? userResourceCount
      : context.count;

    if (count > userResourceCount) {
      interaction.channel.msg({
        reference: interaction.message.id,
        content: `Сэр::: В вашей сумке + инвентаре — :::недостаточно этого ресурса для использования: Вы хотите использовать ${count}, в то время как в инветаре = ${
          userData[key] ?? 0
        }; в сумке = ${
          userData.bag?.[key] ?? 0
        }\n(${userResourceCount} - ${count}), — AAAAAAAAAA`,
      });
      return;
    }

    const {
      used = 0,
      phrase = "\\*Стандартная фраза использования предмета*",
    } =
      (await item.onUse.call(this, {
        context,
        count,
      })) ?? {};

    if (used > userData[key]) {
      this._moveItem({
        isToBag: false,
        user,
        count: used - userData[key],
        context,
        item,
      });
    }

    if (used) {
      Util.addResource({
        user,
        executor: user,
        resource: item.key,
        value: -used,
        context,
        source: "command.bag.usingItem",
      });
    }

    interaction.channel.msg({
      description: `Использовано ${used} ед. предмета\n${phrase}`,
    });
  }

  parseParams(params) {
    const action = params.match(
      /взять|take|get|положить|put|set|использовать|use|використати/,
    )?.[0];
    const count = params.match(/\d+|\+/)?.[0] ?? 1;
    let item = null;
    let rawItem = null;
    const isReceiveAction = ["взять", "take", "get"].includes(action);
    const isPutAction = ["положить", "put", "set"].includes(action);
    const isUseAction = ["использовать", "use", "використати"].includes(action);

    if (action && count) {
      params = params.replace(action, "");
      params = params.replace(count, "");
      rawItem = params = params.trim().toLowerCase();

      item = this.findItem(rawItem);
    }
    return {
      action,
      count,
      item,
      isReceiveAction,
      isPutAction,
      isUseAction,
      rawItem,
    };
  }

  getMoveTargetsOf({ user, isToBag }) {
    const userData = user.data;
    const bagData = CommandUtil.getBagTargetOf(user);
    const targetFrom = isToBag ? userData : bagData;
    const targetTo = isToBag ? bagData : userData;
    return { targetTo, targetFrom };
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

    if (context.isUseAction) {
      this.onActionUseItem(context);
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

      userData.bag ||= {};

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
        item: this.items.find((item) => item.key === key),
        count,
      }))
      .filter(({ item }) => item !== undefined)
      .map(({ item, count }) => item.display(count))
      .map((line) => `– ${line}`);

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

  _moveItem({ user, isToBag, count, item, context }) {
    const { targetTo, targetFrom } = this.getMoveTargetsOf({ isToBag, user });
    user.action(Actions.resourceChange, {
      value: isToBag ? -count : count,
      executor: user,
      source: "command.bag",
      resource: item.key,
      context,
    });

    item.setter({
      target: targetFrom,
      count: item.getter({ target: targetFrom }) - count,
    });
    item.setter({
      target: targetTo,
      count: item.getter({ target: targetTo }) + count,
    });
  }

  moveItem(context, key, count, isToBag) {
    const { userData, interaction, user } = context;
    const item = this.items.find((item) => item.key === key);
    const { targetTo, targetFrom } = this.getMoveTargetsOf({ user, isToBag });

    if (CommandUtil.isPointerAll(count)) {
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

    this._moveItem({
      user: interaction.user,
      isToBag,
      count,
      item,
      context,
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
        '\n\nНикто кроме владельца не может просматривать содержимое сумки. В неё можно положить любой предмет будь то нестабильность, клубника и даже бонусы\nСумка это альтернатива использования казны как личного хранилища. При этом она всегда под рукой!\n\n✏️\n```python\n!bag <"take" | "put"> <item> <count | "+"> # аргументы могут быть указаны в любом порядке\n```\n\n',
    },
    alias: "сумка рюкзак",
    allowDM: true,
    type: "user",
  };
}

export default Command;
