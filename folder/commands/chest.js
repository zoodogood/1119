import * as Util from "#lib/util.js";
import DataManager from "#lib/modules/DataManager.js";
import CurseManager from "#lib/modules/CurseManager.js";
import { Actions } from "#lib/modules/ActionManager.js";
import CooldownManager from "#lib/modules/CooldownManager.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";

class Chest {
  static callOpen({ user }) {
    const count = this.calculateOpenCount({ user });
    return this.getResources({ user, openCount: count });
  }

  static applyTreasures({ user, treasures, context }) {
    const apply = (item, quantity) => {
      switch (item) {
        case "trash":
          break;

        case "gloves":
          Util.addResource({
            user,
            value: quantity,
            executor: user,
            source: "chestManager.applyTreasures",
            resource: PropertiesEnum.thiefGloves,
            context: { treasures, ...context },
          });
          break;

        default:
          Util.addResource({
            user,
            value: quantity,
            executor: user,
            source: "chestManager.applyTreasures",
            resource: item,
            context: { treasures, context },
          });
          break;
      }
    };

    Object.entries(treasures).forEach(([item, quantity]) =>
      apply(item, quantity),
    );
  }

  static calculateOpenCount({ user }) {
    const bonuses = user.data.chestBonus || 0;
    return 2 + Math.ceil(bonuses / 3);
  }

  static getResources({ user, openCount }) {
    const userData = user.data;

    const pushTreasure = (item, quantity) =>
      (treasures[item] = treasures[item]
        ? quantity + treasures[item]
        : quantity);
    const treasuresPull = this.TREASURES_PULL[userData.chestLevel ?? 0];
    const treasures = {};

    let i = openCount;
    while (i > 0) {
      i--;
      const { item, quantity } = treasuresPull.random({ weights: true });
      switch (item) {
        case "bonus":
          i += quantity;
          openCount += quantity;
      }
      pushTreasure(item, quantity);
    }

    return { treasures, openCount };
  }

  static TREASURES_PULL = [
    [
      { item: "void", quantity: 1, _weight: 1 },
      { item: "berrys", quantity: 1, _weight: 4 },
      { item: "keys", quantity: Util.random(2, 3), _weight: 9 },
      { item: "trash", quantity: 0, _weight: 13 },
      { item: "exp", quantity: Util.random(19, 89), _weight: 22 },
      { item: "coins", quantity: Util.random(23, 40), _weight: 46 },
      { item: "chilli", quantity: 1, _weight: 4 },
      { item: "gloves", quantity: 1, _weight: 1 },
    ],
    [
      { item: "void", quantity: 1, _weight: 1 },
      { item: "berrys", quantity: Util.random(1, 2), _weight: 8 },
      { item: "keys", quantity: Util.random(3, 5), _weight: 7 },
      { item: "trash", quantity: 0, _weight: 3 },
      { item: "exp", quantity: Util.random(39, 119), _weight: 22 },
      { item: "coins", quantity: Util.random(88, 148), _weight: 54 },
      { item: "chilli", quantity: 1, _weight: 3 },
      { item: "gloves", quantity: 1, _weight: 2 },
    ],
    [
      { item: "void", quantity: 1, _weight: 1 },
      { item: "berrys", quantity: Util.random(1, 3), _weight: 12 },
      { item: "keys", quantity: 9, _weight: 1 },
      { item: "exp", quantity: Util.random(229), _weight: 22 },
      { item: "coins", quantity: Util.random(304, 479), _weight: 62 },
      { item: "gloves", quantity: 1, _weight: 1 },
      { item: "bonus", quantity: 5, _weight: 1 },
    ],
  ];
}

class ChestManager {
  static open({ user, context }) {
    const userData = user.data;
    const nowBirthday = userData.BDay === DataManager.data.bot.dayDate;
    nowBirthday && (userData.chestBonus = 30 + (userData.chestBonus || 0));

    const { treasures, openCount } = Chest.callOpen({ user });
    delete userData.chestBonus;
    Chest.applyTreasures({ user, treasures, context });

    Object.entries(treasures).forEach((item, quantity) =>
      this.handleTreasure(item, quantity, user),
    );

    return { treasures, openCount };
  }

  static handleTreasure(item, quantity, user) {
    switch (item) {
      case "keys":
        if (quantity > 99) {
          user.action(Actions.globalQuest, { name: "bigHungredBonus" });
        }
        break;
    }
  }

  static cooldown = {
    key: "CD_32",
    for(userData) {
      const cooldown = CooldownManager.api(userData, this.key);
      cooldown.install = function () {
        const timestamp = +Util.dayjs().endOf("date");
        this.setCooldownThreshold(timestamp);
        return this;
      };

      return cooldown;
    },
  };
}

class Command {
  async onChatInput(msg, interaction) {
    const { user, userData } = interaction;

    const cooldown = ChestManager.cooldown.for(userData);
    if (cooldown.checkYet()) {
      const diffContent = Util.timestampToDate(cooldown.diff());
      msg.msg({
        title: `Сундук заперт, возвращайтесь позже!`,
        color: "#ffda73",
        footer: {
          text: `До открытия: ${diffContent}`,
          iconURL:
            "https://vignette.wikia.nocookie.net/e2e-expert/images/b/b3/Chest.png/revision/latest?cb=20200108233859",
        },
      });
      return;
    }

    const chest = {
      icon: [
        "https://cdn.discordapp.com/attachments/629546680840093696/778990528947027988/ezgif.com-gif-maker.gif",
        "https://cdn.discordapp.com/attachments/629546680840093696/778990564779229234/ezgif.com-gif-maker_1.gif",
      ].random(),
      color: "#ffda73",
    };

    const { treasures, openCount } = ChestManager.open({
      user,
      context: { interaction },
    });

    let actualOpenCount = openCount;
    const items = [];

    const handleTreasure = (item, quantity) => {
      switch (item) {
        case "trash":
          actualOpenCount -= quantity;
          delete treasures.trash;
          break;

        case "void":
          Object.assign(chest, {
            color: "#3d17a0",
            icon: "https://media.discordapp.net/attachments/631093957115379733/842122055527694366/image-removebg-preview.png",
          });
          items.push(
            `${Util.ending(
              quantity,
              "Уров",
              "ней",
              "ень",
              "ня",
            )} нестабильности <a:void:768047066890895360>`,
          );
          break;

        case "keys":
          items.push(`${Util.ending(quantity, "Ключ", "ей", "", "а")} 🔩`);
          break;

        case "coins":
          items.push(
            `${Util.ending(
              quantity,
              "Коин",
              "ов",
              "",
              "а",
            )} <:coin:637533074879414272>`,
          );
          break;

        case "exp":
          (() => {
            const emoji = [
              "<:crys:637290406958202880>",
              "<:crys2:763767958559391795>",
              "<:crys3:763767653571231804>",
            ][Math.min(2, Math.floor(quantity / 10))];
            items.push(
              `${Util.ending(quantity, "Опыт", "а", "", "а")} ${emoji}`,
            );
          })();
          break;

        case "berrys":
          items.push(
            `${Util.ending(
              quantity,
              "Клубник",
              "",
              "а",
              "и",
            )} <:berry:756114492055617558>`,
          );
          break;

        case "cake":
          items.push("Один Тортик 🎂");
          break;

        case "bonus":
          items.push(
            `${Util.ending(
              quantity,
              "Сокровищ",
              "",
              "е",
              "а",
            )} для этого сундука <a:chest:805405279326961684>`,
          );
          break;

        case "gloves":
          items.push(`${Util.ending(quantity, "Перчат", "ок", "ка", "ки")} 🧤`);
          break;

        case "chilli":
          items.push(`${Util.ending(quantity, "Пер", "цев", "ец", "ца")} 🌶️`);
          break;

        default:
          break;
      }
    };

    Object.entries(treasures).forEach(([item, quantity]) =>
      handleTreasure(item, quantity),
    );

    const itemsOutput = structuredClone(items);
    msg.author.action(Actions.openChest, { msg, interaction, treasures });

    msg.author.action(Actions.globalQuest, { name: "firstChest" });
    cooldown.install();

    const embed = {
      title: actualOpenCount > 30 ? "Невероятный сундук" : "Ежедневный сундук",
      description: items.length
        ? `БОНУСОВ СУНДУКА — ${actualOpenCount}:`
        : "Ежедневный сундук — пуст. Всего-лишь пара бесполезных крабьих ножек и горы песка... <a:penguin:780093060628873296>",
      color: chest.color,
      thumbnail: !items.length ? chest.icon : null,
      footer: { text: `Уровень сундука: ${userData.chestLevel + 1}` },
    };
    const message = await msg.msg(embed);
    embed.edit = true;

    while (itemsOutput.length) {
      await Util.sleep(1500 / (itemsOutput.length / 2));
      embed.description += itemsOutput
        .splice(0, 1)
        .map((e) => `\n${e}`)
        .join("");
      embed.thumbnail = itemsOutput.length ? null : chest.icon;
      await message.msg(embed);
    }

    if (items.length === 0 && Util.random(2) === 0) {
      const curse = CurseManager.generate({
        hard: null,
        user: interaction.user,
        guild: interaction.guild,
      });

      CurseManager.init({ user: interaction.user, curse });
      await Util.sleep(3000);
      msg.msg({
        description: `${interaction.user}, вы были прокляты. В пустом сундуке и не такое встречается.. 🪸`,
      });
    }
  }

  options = {
    name: "chest",
    id: 32,
    media: {
      description:
        "\n\nЕжедневный-обычный сундук, ничем не примечательный...\nПожалуйста, не пытайтесь в него заглядывать 20 раз в сутки.\n\n❓ Может быть улучшен:\nУлучшение происходит через проведение ритуала в котле при достаточном количестве ресурса, Ключей.\nДля улучшения сундука до второго надо 150 ключей, и 500 до третьего.\n\n✏️\n```python\n!chest #без аргументов\n```\n\n",
    },
    allias: "сундук daily скриня скринька",
    allowDM: true,
    type: "other",
  };
}

export default Command;
export { Chest, ChestManager };
