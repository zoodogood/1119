import { BaseCommand, BaseFlagSubcommand } from "#lib/BaseCommand.js";
import { Emoji } from "#constants/emojis.js";
import { NEW_YEAR_DAY_DATE, SECOND } from "#constants/globals/time.js";
import { Actions } from "#lib/modules/ActionManager.js";
import { PropertiesEnum, PropertiesList } from "#lib/modules/Properties.js";
import * as Util from "#lib/util.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { CliParser } from "@zoodogood/utils/primitives";

function getMoveTargetsOf({ user, isToBag }) {
  const userData = user.data;
  const bagData = getBagTargetOf(user);
  const targetFrom = isToBag ? userData : bagData;
  const targetTo = isToBag ? bagData : userData;
  return { targetTo, targetFrom };
}

function getBagTargetOf(user) {
  const userData = user.data;
  userData.bag ||= {};
  return userData.bag;
}

function moveToBagBrute({ key, count, user }) {
  const bag = getBagTargetOf(user);
  user.data[key] -= count;
  bag[key] ||= 0;
  bag[key] += count;
}

export function addResourceAndMoveToBag({
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

  moveToBagBrute({ key: resource, count: value, user });
}

function checkMoveDetailes({ user, isToBag, count, key }) {
  const item = Command.items.find((item) => item.key === key);
  const { targetTo, targetFrom } = getMoveTargetsOf({ user, isToBag });

  if (isPointerAll(count)) {
    const value = item.getter({ target: targetFrom });
    count = value || 0;
  }
  count = Math.max(Math.floor(count), 0);
  const limit = item.getLimit();
  if (limit && !isToBag) {
    const current = item.getter({ target: targetTo });
    count = Math.min(count, limit - current);
  }

  count ||= 0;

  return {
    limit,
    key,
    item,
    count,
    user,
    isToBag,
    targetTo,
    targetFrom,
  };
}

function summarizeInInventoryAndBag({ user, key }) {
  const userData = user.data;
  return (+userData[key] || 0) + (+userData.bag?.[key] || 0);
}

function isPointerAll(target) {
  return target === "+";
}

// MARK: Contexted
function displayBag(context) {
  const { userData, interaction } = context;
  const items = Object.entries(userData.bag || {})
    .map(([key, count]) => ({
      item: Command.items.find((item) => item.key === key),
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

function _moveItem(moveDetails) {
  const { user, isToBag, count, item, context } = moveDetails;
  const { targetTo, targetFrom } = getMoveTargetsOf({ isToBag, user });
  user.action(Actions.resourceChange, {
    value: isToBag ? -count : count,
    executor: user,
    source: "command.bag",
    resource: item.key,
    context,
  });
  user.action(Actions.bagItemMove, {
    isToBag,
    count,
    moveDetails,
    targetTo,
    targetFrom,
    resource: item.key,
    primary: context,
  });

  item.setter({
    target: targetFrom,
    count: item.getter({ target: targetFrom }) - count,
  });
  item.setter({
    target: targetTo,
    count: item.getter({ target: targetTo }) + count,
  });
  return moveDetails;
}

function movePrepare(moveDetailes, context) {
  const { key, item } = moveDetailes;
  const { user } = context;
  const userData = user.data;
  if (userData[key] === undefined) {
    item.setter({ count: 0, target: userData });
  }

  if (userData.bag[key] === undefined) {
    item.setter({ count: 0, target: userData.bag });
  }
}

class CommandRunContext extends BaseCommandRunContext {
  defaultPrevented = false;
  userData;
  action;
  count;
  itemRaw;
  item;
  preventDefault() {
    this.defaultPrevented = true;
  }
  static new(interaction, command) {
    const context = new this(interaction, command);
    context.userData = interaction.user.data;
    return context;
  }

  parseCli(params) {
    const parser = new CliParser()
      .setText(params)
      .processBrackets()
      .captureFlags(this.command.options.cliParser.flags)
      .captureByMatch({
        name: "action",
        regex:
          /взять|take|get|t|g|положить|put|set|p|s|использовать|use|використати|u/i,
      })
      .captureByMatch({
        name: "count",
        regex: /\d+|\+/,
      })
      .captureByMatch({
        name: "itemRaw",
        regex: /[a-zа-яёъ]+/i,
      });

    const parsed = parser.collect();
    const values = parsed.resolveValues((capture) =>
      capture?.toString().toLowerCase(),
    );
    this.parseCli_processDefaultValues(values);

    values.forEach((value, key) => {
      this[key] = value;
    });

    this.isReceiveAction = ["взять", "take", "get", "t", "g"].includes(
      this.action,
    );
    this.isPutAction = ["положить", "put", "set", "p", "s"].includes(
      this.action,
    );
    this.isUseAction = ["использовать", "use", "використати", "u"].includes(
      this.action,
    );

    this.item = this.command.findItem(this.itemRaw);
    this.setCliParsed(parsed, values);
  }

  parseCli_processDefaultValues(values) {
    const count = values.get("count");
    const itemRaw = values.get("itemRaw");
    if (count && !itemRaw) {
      values.set("itemRaw", PropertiesEnum.coins);
    }

    if (!count && itemRaw) {
      const DEFAULT_COUNT = 1;
      values.set("count", DEFAULT_COUNT);
    }
  }
}

class PutAll_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--put-all",
    capture: ["--put-all"],
    description: "Положить доступные ресурсы в сумку",
  };
  onProcess() {
    const { context } = this;
    const moved = [];
    const { user } = context;
    for (const item of Command.items) {
      const detailes = checkMoveDetailes({
        user,
        isToBag: true,
        count: "+",
        key: item.key,
      });
      detailes.context = this.context;
      if (!detailes.count) {
        continue;
      }
      movePrepare(detailes, context);
      moved.push(_moveItem(detailes));
    }
    this.context.interaction.msg({
      description: moved
        .map(({ item, count }) => {
          return `${item.key}: ${item.ending(count)}`;
        })
        .join(", "),
    });
  }
}

class TakeAll_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--take-all",
    capture: ["--take-all"],
    description: "Захватить доступные ресурсы из сумки",
  };
  onProcess() {
    const { context } = this;
    const moved = [];
    const { user } = context;
    for (const item of Command.items) {
      const detailes = checkMoveDetailes({
        user,
        isToBag: false,
        count: "+",
        key: item.key,
      });
      detailes.context = this.context;
      if (!detailes.count) {
        continue;
      }
      movePrepare(detailes, context);
      moved.push(_moveItem(detailes));
    }
    this.context.interaction.msg({
      description: moved
        .map(({ item, count }) => {
          return `${item.key}: ${item.ending(count)}`;
        })
        .join(", "),
    });
  }
}

class Clean_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--clean",
    capture: ["--clean"],
    description: "Очистить пустые значения в сумке",
  };
  onProcess() {
    const { context } = this;
    const { user, interaction } = context;
    const bag = user.data.bag || {};
    const toClean = Object.entries(bag).filter((entrie) => !entrie[1]);
    for (const [key] of toClean) {
      delete bag[key];
    }
    interaction.msg({
      description: `Очищено ${Util.ending(toClean.length, "свойств", "", "о", "а")}`,
    });
  }
}

class Mention_Subcommand extends BaseFlagSubcommand {
  processIsAuthor() {
    const { mention, user } = this.context.interaction;
    if (mention !== user) {
      return false;
    }

    displayBag(this.context);
    return true;
  }
  processDefault() {
    const { message } = this.context.interaction;
    message.msg({
      title:
        "Вы не можете просматривать содержимое сумки у других пользователей",
      color: "#ff0000",
      delete: 15_000,
      description:
        "Попросите человека открыть сумку, чтобы вы смогли увидеть содержимое",
    });
    return true;
  }
  onProcess() {
    return this.processIsAuthor() || this.processDefault();
  }
}

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
    onUse({ context }) {
      const {
        interaction: { channel },
      } = context;

      const contents = {
        description: "Вы кидаете монетку",
        endFlip: Util.random(1) ? "Орёл" : "Решка",
        result: ``,
      };

      setTimeout(() => {
        channel.msg({
          description: `${contents.endFlip}. ${contents.result}`,
        });
      }, SECOND * 2);

      const phrase = `${contents.description}`;
      return { phrase, used: 1 };
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
      const { boss } = guild.data;

      const BossManager = (await import("#lib/modules/BossManager.js")).default;
      if (BossManager.isArrivedIn(guild) || boss?.apparanceAtDay - 2 <= today) {
        const phrase =
          "Неудалось применить леденец:\nВы можете применить этот предмет в момент отсутствия босса на сервере, но не за 3 дня до его появления";
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

class Command extends BaseCommand {
  static items = ITEMS.map((itemData) => Item.from(itemData));

  findItemByAlias(alias) {
    return Command.items.find((item) =>
      item.names.includes(alias.toLowerCase()),
    );
  }

  findItemByKey(key) {
    return Command.items.find(
      (item) => item.key.toLowerCase() === key.toLowerCase(),
    );
  }

  findItem(item = "") {
    return this.findItemByKey(item) || this.findItemByAlias(item);
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
    const userResourceCount = summarizeInInventoryAndBag({
      user,
      key,
    });
    const count = isPointerAll(context.count)
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
      _moveItem({
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

    const emoji = Emoji[PropertiesList[item.key].emojiKey];

    interaction.channel.msg({
      description: `${Util.ending(used, "единиц", "", "а", "ы")} предмета ${emoji} — использовано\n${phrase}`,
    });
  }

  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }

  async run(context) {
    context.parseCli(context.interaction.params);
    if (await this.processMention(context)) {
      return;
    }

    const { interaction, defaultPrevented } = context;

    interaction.user.action(Actions.beforeBagInteracted, context);
    if (defaultPrevented) {
      interaction.channel.msg({
        delete: 7_000,
        title: "Взаимодействие с сумкой заблокированно внешним эффектом",
      });
      return;
    }
    if (await this.processPutAllFlag(context)) {
      return;
    }
    if (await this.processTakeAllFlag(context)) {
      return;
    }
    if (await this.processCleanFlag(context)) {
      return;
    }

    this.processDefaultBehaviour(context);
  }

  async processDefaultBehaviour(context) {
    const { count, item, userData } = context;

    if (context.isUseAction) {
      this.onActionUseItem(context);
      return;
    }

    if (!this.processItemIsExists(context)) {
      return;
    }

    if (item) {
      const isToBag = context.isPutAction;
      userData.bag ||= {};
      this.moveItem(context, item.key, count, isToBag);
      return;
    }

    await displayBag(context);
    return;
  }

  async processMention(context) {
    const { mention } = context.interaction;
    if (!mention) {
      return false;
    }

    new Mention_Subcommand(context).onProcess();
    return true;
  }

  async processTakeAllFlag(context) {
    const value = context.cliParsed.at(1).get("--take-all");
    if (!value) {
      return false;
    }
    await new TakeAll_FlagSubcommand(context, value).onProcess();
    return true;
  }

  async processPutAllFlag(context) {
    const value = context.cliParsed.at(1).get("--put-all");
    if (!value) {
      return false;
    }
    await new PutAll_FlagSubcommand(context, value).onProcess();
    return true;
  }

  async processCleanFlag(context) {
    const value = context.cliParsed.at(1).get("--clean");
    if (!value) {
      return false;
    }
    await new Clean_FlagSubcommand(context, value).onProcess();
    return true;
  }

  processItemIsExists(context) {
    const { action, count, item, itemRaw, channel } = context;
    if (!action || !count) {
      return true;
    }
    if (item) {
      return true;
    }
    const list = Command.items.reduce(
      (acc, item) => acc.concat(item.names),
      [],
    );
    const similarItem = Util.getSimilar(list, itemRaw);
    channel.msg({
      title: "Не удалось найти такой предмет:",
      description: `\`${itemRaw}\`${
        similarItem ? `\n\nВозможно, Вы имели ввиду: ${similarItem}?` : ""
      }`,
      delete: 7000,
    });
    return false;
  }

  moveItem(context, key, count, isToBag) {
    const { interaction, user } = context;

    const moveDetailes = checkMoveDetailes({ user, isToBag, count, key });
    movePrepare(moveDetailes, context);

    const { targetFrom, item } = moveDetailes;

    const currentCount = item.getter({ target: targetFrom });
    if (currentCount < count) {
      const description = `Надо на ${item.ending(count - currentCount)} больше!`;
      interaction.channel.msg({
        title: "Недостаточно ресурса",
        delete: 7_000,
        description,
      });
      return;
    }

    moveDetailes.context = context;
    const moved = _moveItem(moveDetailes);

    const bagDescription = isToBag
      ? "в а-ля вакуумный объект"
      : "из черной дыры";
    const description = `Вы успешно ${
      isToBag ? "положили" : "взяли"
    } ${item.ending(moveDetailes.count)} ${bagDescription}.`;

    interaction.channel.msg({
      title: `Действие с сумка ${interaction.user.tag}`,
      delete: 9_000,
      description,
    });

    return moved;
  }

  options = {
    name: "bag",
    id: 58,
    media: {
      description:
        "Никто кроме владельца не может просматривать содержимое сумки. В неё можно положить любой предмет будь то нестабильность, клубника и даже бонусы\nСумка это альтернатива использования казны как личного хранилища. При этом она всегда под рукой!",
      example: `!bag <"take" | "put"> <item> <count | "+"> # аргументы могут быть указаны в любом порядке`,
    },
    accessibility: {
      publicized_on_level: 5,
    },
    cliParser: {
      flags: [
        TakeAll_FlagSubcommand.FLAG_DATA,
        PutAll_FlagSubcommand.FLAG_DATA,
        Clean_FlagSubcommand.FLAG_DATA,
      ],
    },
    cooldown: 3 * SECOND,
    cooldownTry: 3,
    alias: "сумка рюкзак",
    allowDM: true,
    type: "user",
  };
}

export default Command;
