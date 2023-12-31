import { ActionsMap } from "#constants/enums/actionsMap.js";
import { PropertiesList, PropertiesEnum } from "#lib/modules/Properties.js";
import * as Util from "#lib/util.js";
import Discord from "discord.js";

class Command {
  RESOURCES_MAP = [
    {
      resource: "coins",
      names: "coins coin коин коинов коина коины монет монету монеты монета",
      gives: (n) =>
        `${Util.ending(n, "коин", "ов", "", "а")} <:coin:637533074879414272>`,
    },

    {
      resource: "void",
      names:
        "void камень камня камней нестабильность камни нестабильности нест н",
      gives: (n) =>
        `${Util.ending(n, "кам", "ней", "ень", "ня")} нестабильности`,
    },

    {
      resource: "chestBonus",
      names:
        "bonus chest бонус бонусов бонуса бонусы сундук сундука сундуки сундуков б с",
      gives: (n) => `${Util.ending(n, "бонус", "ов", "", "а")} сундука`,
    },

    {
      resource: "chilli",
      names: "chilli перец перца перцев перцы",
      gives: (n) => Util.ending(n, "пер", "цев", "ец", "ца"),
    },

    {
      resource: "keys",
      names: "keys key ключ ключей ключа ключи k к",
      gives: (n) => Util.ending(n, "ключ", "ей", "", "а"),
    },

    {
      resource: "berrys",
      names: "клубника клубник клубники berrys berry ягод ягода ягоды",
      gives: (n) => Util.ending(n, "клубник", "", "а", "и"),
    },

    {
      resource: "monster",
      names: "monster монстр монстра монстров монстры",
      gives: (n) => Util.ending(n, "монстр", "ов", "", "а"),
    },

    {
      resource: "seed",
      names: "seed семян семечек семечко семечка seeds",
      gives: (n) => Util.ending(n, "сем", "ечек", "ечко", "ечка"),
    },

    {
      resource: "presents",
      names: "presents подарок подарка подарков present",
      gives: (n) => Util.ending(n, "подар", "ков", "ок", "ка"),
    },

    {
      resource: PropertiesEnum.lollipops,
      names: PropertiesList.lollipops.allias,
      gives: (n) => Util.ending(n, "леден", "цов", "ец", "ца"),
    },

    {
      resource: PropertiesEnum.snowyTree,
      names: PropertiesList.snowyTree.allias,
      gives: (n) => `${n} snowyTree`,
    },
  ];

  pay(context) {
    const { interaction, memb } = context;
    interaction.user.action(ActionsMap.beforeResourcePayed, context);
    memb.action(ActionsMap.beforeResourcePayed, context);

    const { resource, missive, numeric, item } = context;

    if (context.event.defaultPrevented) {
      interaction.channel.msg({
        description:
          "Сделка заблокированна внешним эффектом, применнёным на одного из участников.\nСписок эффектов может быть просмотрен с около базовыми навыками работы с !eval",
        color: "#ff0000",
      });
      return;
    }

    Util.addResource({
      user: interaction.user,
      value: -numeric,
      executor: interaction.user,
      source: "command.pay",
      resource,
      context: { interaction, context },
    });

    Util.addResource({
      user: memb,
      value: numeric,
      executor: interaction.user,
      source: "command.pay",
      resource,
      context: { interaction, context },
    });

    interaction.channel.msg({
      description:
        `${interaction.user.username} отправил ${item.gives(
          numeric,
        )} для ${memb.toString()}` +
        (missive ? `\nС сообщением:\n${missive}` : ""),
      author: { name: "Передача", iconURL: interaction.user.avatarURL() },
    });
  }

  getContext(interaction) {
    let { params } = interaction;
    const { mention } = interaction;
    params = params.replace(new RegExp(`<@!?${mention.id}>`), "");

    const event = new Event("command.pay", { cancelable: true });
    const numeric = params.match(/\d+|\+/)?.[0];
    if (!numeric) {
      interaction.channel.msg({
        title: "Вы не ввели значение. Ожидается сумма передачи.",
        color: "#ff0000",
      });
      return null;
    }

    params = params.replace(numeric, "").trim();
    const [itemName, ...messageParam] = params.split(" ");
    const missive = messageParam;

    const context = {
      event,
      interaction,
      itemNameRaw: itemName,
      missiveRaw: missive,
      numericRaw: numeric,
      memb: mention,
    };
    return context;
  }

  async onChatInput(msg, interaction) {
    const context = this.getContext(interaction);
    if (!context) {
      return;
    }
    const { missiveRaw, itemNameRaw, numericRaw, memb } = context;

    if (memb.bot) {
      msg.msg({ title: "Вы не можете передать что-либо боту" });
      return;
    }

    const heAccpet = await Util.awaitUserAccept({
      name: "give",
      message: {
        title: "Используя эту команду вы потеряете коины или другие ресурсы",
      },
      channel: msg.channel,
      userData: interaction.userData,
    });
    if (!heAccpet) return;

    if (memb === interaction.user) {
      msg.msg({
        title: `${msg.author.username} попытался наколдовать немного ресурсов (${numeric} ❔) — безуспешно.`,
      });
      return;
    }

    const resourcesMap = this.RESOURCES_MAP;
    let missive = missiveRaw;
    const item =
      resourcesMap.find((obj) =>
        obj.names.split(" ").includes(itemNameRaw.toLowerCase()),
      ) ||
      (() => {
        const DEFAULT = 0;
        missive = [itemNameRaw, ...missive];
        return resourcesMap[DEFAULT];
      })();

    const resource = item.resource;

    missive = missive.join(" ");

    const numeric = (() => {
      let value = numericRaw;
      if (numericRaw === "+") {
        value = +interaction.userData[resource];
      }
      value = Math.floor(value);

      if (isNaN(value)) {
        value = 0;
      }
      return value;
    })();

    if (numeric < 0) {
      msg.msg({
        title:
          "Введено отрицательное значение.\n<:grempen:753287402101014649> — Укушу.",
      });
      return;
    }

    if ((interaction.userData[resource] || 0) < numeric) {
      const description = Discord.escapeMarkdown(msg.content);
      msg.msg({
        title: `Нужно ещё ${item.gives(
          numeric - interaction.userData[resource],
        )}`,
        description,
        delete: 12000,
      });
      return;
    }

    Object.assign(context, {
      item,
      numeric,
      missive,
      resource,
    });

    this.pay(context);
  }

  options = {
    name: "pay",
    id: 14,
    media: {
      description:
        '\n\nИспользуйте, чтобы передать коины другому пользователю в качестве доброго подарка или оплаты за помощь :wink:\n\n✏️\n```python\n!pay {memb} {coinsCount | "+"} <message> #аргументы можно указывать в любом порядке. "+" обозначает "Все коины, которые у вас есть"\n```\n\n',
    },
    allias: "give дать передать заплатить дати заплатити передати",
    expectMention: true,
    allowDM: true,
    cooldown: 7_000,
    cooldownTry: 10,
    type: "user",
  };
}

export default Command;
