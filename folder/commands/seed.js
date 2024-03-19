import { BaseCommand } from "#lib/BaseCommand.js";
import * as Util from "#lib/util.js";
import { client } from "#bot/client.js";
import DataManager from "#lib/modules/DataManager.js";
import BerryCommand from "#folder/commands/berry.js";
import EventsManager from "#lib/modules/EventsManager.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";

class CommandRunContext extends BaseCommandRunContext {
  guildData;
  costsUp = null;
  interfaceMessage = null;
  berrysCollected = 0;

  static new(interaction, command) {
    const context = new this(interaction, command);
    context.guildData = interaction.guild.data;
    context.level = context.guildData.treeLevel || 0;
    context.costsUp = command.getCostsUp(context);
    return context;
  }

  setInterfaceMessage(message) {
    this.interfaceMessage = message;
    return this;
  }
}

class Command extends BaseCommand {
  async run(context) {
    const { channel, guildData } = context;
    const embed = this.createEmbed(context);
    context.setInterfaceMessage(await channel.msg(embed));

    const { interfaceMessage } = context;

    if (context.level < 20) {
      await interfaceMessage.react("🌱");
    }

    if (guildData.berrys >= 1) {
      await interfaceMessage.react("756114492055617558");
    }

    const filter = (reaction, user) =>
      user.id !== client.user.id &&
      (reaction.emoji.name === "🌱" ||
        reaction.emoji.id === "756114492055617558");
    const collector = interfaceMessage.createReactionCollector({
      filter,
      time: 180000,
    });
    collector.on("collect", async (reaction, user) => {
      this.onCollect(reaction, user, context);
    });

    collector.on("end", interfaceMessage.reactions.removeAll);
  }
  async onChatInput(msg, interaction) {
    const context = CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }

  updateBerrysCount(context) {
    const { level, guildData } = context;
    const timePassed = Date.now() - guildData.treeEntryTimestamp || 0;
    const speedGrowth = this.getSpeedGrowth({ level });
    const limit = speedGrowth * 360;

    const adding = (timePassed / 86_400_000) * speedGrowth;
    const berrys = (guildData.berrys || 0) + adding;
    guildData.berrys = Math.min(berrys, limit);

    guildData.treeEntryTimestamp = Date.now();
    return;
  }

  createEmbed(context) {
    const { level, costsUp, guildData } = context;
    this.updateBerrysCount(context);

    const speedGrowth = this.getSpeedGrowth({ level });
    const createFields = () => {
      const FIELDS = [
        {
          label: "Не посажено",
          callback: () => {
            const value =
              "Ему ещё предстоит вырасти, будучи семечком дерево не может давать плоды.\nОбязательно посадите семя, если оно у вас есть.\n\n❓ Выполняя каждый 50-й квест вы получаете по две штуки";
            return { name: "Рост", value };
          },
          filter: () => level === 0,
        },
        {
          callback: () => {
            const { metric, count } =
              speedGrowth > 100
                ? { metric: "минуту", count: speedGrowth / 1440 }
                : speedGrowth > 10
                  ? { metric: "час", count: speedGrowth / 24 }
                  : { metric: "день", count: speedGrowth };
            const contents = {
              speed: `Клубники выростает ${count} в ${metric}`,
              ready: `Готово для сбора: ${Math.floor(guildData.berrys)}`,
              nextIn: `Следущая дозреет через: ${Util.timestampToDate(
                ((1 - (guildData.berrys % 1)) * 86400000) / speedGrowth,
              )} <:berry:756114492055617558>`,
            };
            const name = "Плоды";
            const value = `${contents.speed}\n${contents.ready}\n${contents.nextIn}`;

            return { name, value };
          },
          filter: () => level !== 0,
        },
        {
          callback: () => {
            const entrySeeds = guildData.treeSeedEntry || 0;
            const contents = {
              forIncreaseNeed: `${
                costsUp - entrySeeds > 5
                  ? costsUp - entrySeeds
                  : ["ноль", "одно", "два", "три", "четыре", "пять"][
                      costsUp - entrySeeds
                    ]
              } ${Util.ending(
                costsUp - entrySeeds,
                "сем",
                "ян",
                "ечко",
                "ечка",
                { unite: (_quantity, word) => word },
              )}`,
              level: `Уровень деревца ${level}`,
            };
            const name = "Дерево";
            const value = `${contents.level} ${
              level === 20
                ? "(Максимальный)"
                : `\nДо повышения нужно ${contents.forIncreaseNeed}`
            }`;
            return { name, value };
          },
          filter: () => level !== 0,
        },
        {
          callback: () => {
            const messagesNeed = this.calculateMessagesNeed(context);

            const status = guildData.treeMisstakes
              ? messagesNeed <= guildData.day_msg
                ? "Дерево восстанавливается"
                : "Следите, чтобы дерево не засохло"
              : messagesNeed <= guildData.day_msg
                ? "Дерево счастливо"
                : "Дерево радуется";

            const value =
              messagesNeed <= guildData.day_msg
                ? "Необходимое количество сообщений уже собрано!"
                : `Сообщений собрано: ${guildData.day_msg}/${messagesNeed} ${
                    guildData.treeMisstakes
                      ? `\nРискует завянуть через ${+(
                          4 - guildData.treeMisstakes
                        ).toFixed(1)}д`
                      : ""
                  }`;

            return { name: `💧 ${status}`, value };
          },
          filter: () => level !== 0,
        },
        {
          callback: () => {
            const count = context.berrysCollected;
            const name = "Клубники собрали участники";
            const value = `${Util.ending(count, "штук", "", "а", "и")};`;
            return { name, value };
          },
          filter: () => context.berrysCollected,
        },
      ];

      return FIELDS.filter((field) => field.filter()).map((field) =>
        field.callback(),
      );
    };

    const embed = {
      title: "Живое, клубничное дерево",
      thumbnail: this.THUMBAIL_IMAGES_TABLE[Math.ceil(level / 4)],
      description: `Это растение способно принести океан клубники за короткий срок. Для этого заботьтесь о нём: общайтесь на сервере, поддерживайте теплую атмосферу, проводите время весело. Оно может может засохнуть!`,
      fields: createFields(),
      footer: {
        text: "Ваши сообщения полностью заменяют собой воду, в том числе используются для полива растений",
        iconURL:
          "https://media.discordapp.net/attachments/629546680840093696/1065874615055958056/water.png",
      },
    };

    return embed;
  }

  MESSAGES_NEED_TABLE = [
    0, 70, 120, 180, 255, 370, 490, 610, 730, 930, 1270, 1500, 1720, 2200, 2700,
    3200, 3700, 4500, 5400, 7400, 12000,
  ];
  GROWTH_SPEED_TABLE = [
    0, 0.8, 1.2, 1.8, 2.5, 5, 7.5, 10, 12, 15.6, 21, 24, 42, 54, 66, 84, 108,
    144, 252, 360, 450, 792,
  ];
  COSTS_TABLE = [1, 1, 1, 3, 2, 2, 2, 4, 2, 2, 2, 5, 3, 3, 3, 7, 4, 4, 4, 10];
  THUMBAIL_IMAGES_TABLE = [
    null,
    "https://cdn.discordapp.com/attachments/629546680840093696/875367772916445204/t1.png",
    "https://cdn.discordapp.com/attachments/629546680840093696/875367713411858492/t2.png",
    "https://cdn.discordapp.com/attachments/629546680840093696/875367267318247444/t3.png",
    "https://cdn.discordapp.com/attachments/629546680840093696/875366344642662510/t4_digital_art_x4.png",
    "https://cdn.discordapp.com/attachments/629546680840093696/875366096952246312/t9.png",
  ];

  GLOBAL_MESSAGES_NEED_MULTIPLAYER = 0.3;

  calculateMessagesNeed({ level, guildData, guild }) {
    const basic = this.MESSAGES_NEED_TABLE[level];
    const byMembersCount = guild.memberCount * 3;
    const byDayAverage = (guildData.day_average || 0) / 5;

    const treeMistakesMultiplayer =
      "treeMisstakes" in guildData ? 1 - 0.1 * guildData.treeMisstakes : 1;
    const globalMultiplayer = this.GLOBAL_MESSAGES_NEED_MULTIPLAYER;
    const count =
      (basic + byMembersCount + byDayAverage) *
      globalMultiplayer *
      treeMistakesMultiplayer;
    return Math.floor(count);
  }

  getCostsUp({ level }) {
    return this.COSTS_TABLE[level];
  }

  getSpeedGrowth({ level }) {
    return this.GROWTH_SPEED_TABLE[level];
  }

  async onLevelUp(context) {
    const { guildData, message, channel } = context;
    guildData.treeSeedEntry = 0;
    context.level = guildData.treeLevel = (guildData.treeLevel ?? 0) + 1;
    context.costsUp = this.COSTS_TABLE[context.level];

    await message.react("756114492055617558");

    channel.msg({
      title: "Дерево немного подросло",
      description: `После очередного семечка 🌱, дерево стало больше и достигло уровня ${context.level}!`,
    });
    delete guildData.treeMisstakes;
  }

  async onCollect(reaction, user, context) {
    const { guildData, interfaceMessage, channel } = context;
    const react = reaction.emoji.id || reaction.emoji.name;
    const userData = user.data;

    if (react === "🌱") {
      if (context.level >= 20) {
        channel.msg({
          title: "Ещё больше?",
          description: `Не нужно, дерево уже максимального уровня!`,
          author: { name: user.username, iconURL: user.avatarURL() },
          delete: 7000,
        });
        interfaceMessage.reactions.resolve("🌱").remove();
        return;
      }

      if (!userData.seed) {
        channel.msg({
          title: "У вас нет Семян",
          description: `Где их достать? Выполняйте ежедневные квесты, каждый 50-й выполненый квест будет вознаграждать вас двумя семечками.`,
          author: { name: user.username, iconURL: user.avatarURL() },
          delete: 7000,
        });
        return;
      }

      this.onSeedEntry(user, context);
    }

    // Berry take
    if (react === "756114492055617558") {
      if (userData.CD_54 > Date.now()) {
        channel.msg({
          title: "Перезарядка...",
          description: `Вы сможете собрать клубнику только через **${Util.timestampToDate(
            userData.CD_54 - Date.now(),
          )}**`,
          footer: { text: "Перезарядка уменьшается по мере роста дерева" },
          author: { name: user.username, iconURL: user.avatarURL() },
          delete: 7000,
          color: "#ff0000",
        });
        return;
      }

      if (guildData.berrys < 1) {
        channel.msg({
          title: "Упс..!",
          description:
            "На дереве закончилась клубника. Возможно, кто-то успел забрать клубнику раньше вас.. Ждите, пока дозреет следущая, не упустите её!",
          author: { name: user.username, iconURL: user.avatarURL() },
          delete: 7000,
          color: "#ff0000",
        });
        return;
      }

      const berrys = this.calculateBerrysTake({
        guildData,
        userData,
        level: context.level,
      });
      this.onBerryCollect(berrys, user, context);
    }

    const embed = this.createEmbed(context);
    await interfaceMessage.msg({ ...embed, edit: true });
  }

  onSeedEntry(user, context) {
    const { guildData, channel } = context;
    Util.addResource({
      user,
      value: -1,
      resource: PropertiesEnum.seed,
      executor: user,
      context,
      source: "command.seed.onSeedEntry",
    });
    guildData.treeSeedEntry = (guildData.treeSeedEntry ?? 0) + 1;
    channel.msg({
      title: `Спасибо за семечко, ${user.username}`,
      description: `🌱 `,
      delete: 7_000,
    });

    if (guildData.treeSeedEntry >= context.costsUp) {
      this.onLevelUp(context);
    }
  }

  onBerryCollect(berrys, user, context) {
    const { guildData, channel } = context;
    const userData = user.data;

    Util.addResource({
      user,
      value: berrys,
      resource: PropertiesEnum.berrys,
      executor: user,
      context,
      source: "command.seed.onBerryCollect",
    });
    guildData.berrys -= berrys;
    context.berrysCollected += berrys;

    DataManager.data.bot.berrysPrice += berrys * BerryCommand.INFLATION;
    channel.msg({
      title: "Вы успешно собрали клубнику",
      author: { name: user.username, iconURL: user.avatarURL() },
      description: `${
        berrys > 5
          ? berrys
          : ["Ноль", "Одна", "Две", "Три", "Четыре", "Пять"][berrys]
      } ${Util.ending(berrys, "ягод", "", "а", "ы", {
        unite: (_quantity, word) => word,
      })} ${Util.ending(berrys, "попа", "дают", "ла", "ли", {
        unite: (_quantity, word) => word,
      })} в ваш карман <:berry:756114492055617558>`,
      delete: 9000,
    });
    userData.CD_54 = Date.now() + this.calculateCooldown(context);

    this.becomeCoinMessage({ user });
  }

  calculateBerrysTake({ guildData, level, userData }) {
    const isBerryMany = guildData.berrys > this.getSpeedGrowth({ level }) * 3;

    const farmerBonus = userData.voidTreeFarm ?? 0;

    const basic = 1 + farmerBonus;
    const berryManyBonus = isBerryMany
      ? Util.random(0, 3 + farmerBonus * 2, { round: false })
      : 0;

    const berrys = basic + berryManyBonus;

    return Math.floor(Math.min(berrys, guildData.berrys));
  }

  calculateCooldown(context) {
    return Math.max(
      (86_400_000 / this.getSpeedGrowth(context)) * (1 + context.level),
      7_200_000,
    );
  }

  onDayStats(guild, eventContext) {
    const guildData = guild.data;
    const level = guildData.treeLevel;
    const messagesNeed = this.calculateMessagesNeed({
      guild,
      guildData,
      level,
    });

    guildData.treeMisstakes ||= 0;

    if (guildData.day_msg < messagesNeed) {
      guildData.treeMisstakes +=
        0.2 + Number((1 - guildData.day_msg / messagesNeed).toFixed(1));

      eventContext.guilds[guild.id] ||= {};
      eventContext.guilds[guild.id].messagesNeed = messagesNeed;

      if (guildData.treeMisstakes >= 4) {
        delete guildData.treeMisstakes;
        guildData.treeLevel--;
      }

      return;
    }

    guildData.treeMisstakes -= 0.2;

    if (guildData.treeMisstakes <= 0) {
      delete guildData.treeMisstakes;
    }
  }

  becomeCoinMessage({ user }) {
    const become = async (user) => {
      const filter = (message) => message.author.id === user.id;
      const collector = new Util.CustomCollector({
        target: client,
        event: "message",
        filter,
        time: 500_000,
      });
      collector.setCallback((message) => {
        collector.end();
        EventsManager.emitter.emit("users/getCoinsFromMessage", {
          user,
          message,
        });
      });
    };

    !Util.random(0, 5) && become(user);
  }

  options = {
    name: "seed",
    id: 54,
    media: {
      description:
        '\n\nКлубничное дерево? М-м, вкусно, а говорят они на деревьях не ростут..\nОно общее и распространяется по серверу. Будет приносить ягоды, которые может собрать каждый\n_Будьте осторожны, растение может засохнуть, если на сервере недостаточно "актива"_\n\n✏️\n```python\n!tree #без аргументов\n```\n\n',
    },
    alias:
      "tree livetree семечко berrystree дерево клубничноедерево живоедерево",
    allowDM: true,
    type: "other",
  };
}

export default Command;
