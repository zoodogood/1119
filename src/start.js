console.clear();

import "dotenv/config";

import Discord, { ActivityType, AuditLogEvent } from "discord.js";

import * as Util from "#lib/util.js";
import {
  DataManager,
  BossManager,
  TimeEventsManager,
  CommandsManager,
  ActionManager,
  EventsManager,
} from "#lib/modules/mod.js";
import { justSendMessage } from "@zoodogood/utils/discordjs";
import client from "#bot/client.js";
import config from "#config";

import app from "#app";
import FileSystem from "fs";
import { Actions } from "#lib/modules/ActionManager.js";
import { LEVELINCREASE_EXPERIENCE_PER_LEVEL } from "#constants/users/events.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";

client.on("ready", async () => {
  client.guilds.cache.forEach(
    async (guild) =>
      (guild.invitesCollection = await guild.invites.fetch().catch(() => {})),
  );

  if (config.development) {
    client.user.setActivity("Кабзец тебе, Хозяин", {
      type: ActivityType.Streaming,
      url: "https://www.twitch.tv/monstercat",
    });
  } else {
    client.user.setActivity("намана", { type: "WATCHING" });
  }

  //----------------------------------{Events and intervals--}------------------------------                            #0bf

  client.on("messageCreate", async (message) => {
    DataManager.data.bot.messagesToday++;

    if (message.author.bot) {
      return;
    }

    message.author.action(Actions.messageCreate, message);

    eventHundler(message);
    const commandContext =
      CommandsManager.parseInputCommandFromMessage(message);
    const command = commandContext?.command;
    if (
      commandContext &&
      CommandsManager.checkAvailable(command, commandContext)
    ) {
      CommandsManager.execute(command, commandContext);
    }
  });

  client.on("inviteCreate", async (invite) => {
    const guild = invite.guild;
    guild.invitesCollection = await guild.invites.fetch();
  });

  client.on("inviteDelete", async (invite) => {
    //let guild = invite.guild;
  });

  client.on("guildCreate", async (guild) => {
    const members = guild.members.cache.filter((e) => !e.user.bot);
    let whoAdded = await guild.Audit((e) => e.target.id === client.user.id, {
      type: AuditLogEvent.BotAdd,
    });
    whoAdded = whoAdded ? whoAdded.target : null;

    const developerChat = client.channels.cache.get(config.guild.logChannelId);
    if (developerChat) {
      const title = `Бот присоеденился к серверу ${guild.name}!`;
      const description = `Участников: ${
        members.size
      }\nКол-во знакомых боту людей: ${
        members.filter((member) =>
          DataManager.data.users.some((user) => user.id === member.id),
        ).size
      }\nПригласил пользователь этого сервера?: ${
        whoAdded && guild.members.resolve(whoAdded) ? "Да" : "Нет"
      }.`;
      developerChat.msg({
        title,
        description,
        footer: { text: `Серверов: ${client.guilds.cache.size}` },
      });
    }

    guild.invitesCollection = await guild.invites.fetch();
    DataManager.data.bot.addToNewGuildAt = Date.now();
  });

  client.on("guildDelete", async (guild) => {
    client.users.cache
      .get("921403577539387454")
      .msg({ title: `Бота забанили на сервере ${guild.name}!` });
  });

  client.on("messageReactionAdd", async (reaction, user) => {
    if (reaction.emoji.name === "👍") {
      const target = (await reaction.message.fetch({ force: false })).author;

      user.action(Actions.likedTheUser, {
        target,
        likeType: "reaction",
        reaction,
      });
    }

    const msg = reaction.message;
    let rolesReactions = ReactionsManager.reactData.find(
      (target) => target.id === msg.id,
    );
    if (!rolesReactions) {
      return;
    }
    let role;
    switch (rolesReactions.type) {
      case "reactor":
        rolesReactions = rolesReactions.reactions;

        role = String(rolesReactions[reaction.emoji.id || reaction.emoji.name]);
        if (!role) {
          break;
        }
        role = reaction.message.guild.roles.cache.get(role);
        if (!role) {
          reaction.message.msg({
            title: "Не удалось найти роль, вероятно она удалена",
            color: "#ff0000",
            delete: 7000,
          });
          reaction.remove();
          return;
        }
        reaction.message.guild.members.resolve(user).roles.add(role);
        break;
    }
  });

  client.on("messageReactionRemove", async (reaction, user) => {
    const msg = reaction.message;
    let rolesReactions = ReactionsManager.reactData.find(
      (target) => target.id === msg.id,
    );
    if (!rolesReactions) {
      return;
    }
    let role;
    switch (rolesReactions.type) {
      case "reactor":
        rolesReactions = rolesReactions.reactions;

        role = String(rolesReactions[reaction.emoji.id || reaction.emoji.name]);
        role = reaction.message.guild.roles.cache.get(role);
        if (!role)
          reaction.message.msg({
            title: "Не удалось найти роль, вероятно она удалена",
            color: "#ff0000",
            delete: 7000,
          });
        reaction.message.guild.members.resolve(user).roles.remove(role);
        break;
    }
  });

  client.on("guildMemberRemove", async (member) => {
    if (!member.guild.data.leave_roles) {
      member.guild.data.leave_roles = {};
    }
    member.guild.data.leave_roles[member.user.id] = Array.from(
      member.roles.cache.keys(),
    );

    const banInfo =
      (await member.guild.Audit((audit) => audit.target.id === member.id, {
        limit: 50,
        type: AuditLogEvent.MemberBanAdd,
      })) ||
      (await member.guild.Audit((audit) => audit.target.id === member.id, {
        limit: 50,
        type: AuditLogEvent.MemberKick,
      }));
    const reason = () => (banInfo.reason ? `\nПричина: ${banInfo.reason}` : "");

    const name = `Имя: ${member.user.tag}${member.user.bot ? " BOT" : ""}`;

    const message = banInfo
      ? {
          content: `Участник был ${
            banInfo.action === AuditLogEvent.MemberKick ? "кикнут" : "забанен"
          }`,
          description: `${name}\nВыгнавший с сервера: ${
            member.guild.members.resolve(banInfo.executor).displayName
          } ${reason().slice(0, 1000)}`,
        }
      : {
          content: "Участник покинул сервер",
          description: `${name}\nНадеемся, он скоро вернётся`,
        };

    member.guild.logSend({
      title: message.content,
      description: message.description,
      color: banInfo ? "#ff0000" : "#00ff00",
    });
  });

  client.on("userUpdate", async (old, user) => {
    if (old.avatar === user.avatar) {
      return;
    }
    user.guilds.forEach((guild) =>
      guild.logSend({
        title: `${guild.members.resolve(user).displayName} изменил свой аватар`,
        author: {
          name: user.username,
          iconURL: user.avatarURL({ dynamic: true }),
        },
        description: "",
        footer: {
          text: "Старый аватар",
          iconURL: old.displayAvatarURL({ dynamic: true }),
        },
      }),
    );
  });
});

//----------------------------------{Functions--}------------------------------                            #0f0

async function msg(options, ..._devFixParams) {
  if (_devFixParams.length > 0) {
    console.log(message, options);
    throw new Error("Incorrect message input. Need to fix!");
  }

  options.color ||= config.development ? "#000100" : "#23ee23";

  const target =
    this instanceof Discord.InteractionResponse
      ? this.interaction
      : this instanceof Discord.Message && !options.edit
        ? this.channel
        : this;

  const message = await justSendMessage(target, options);

  return message;
}

//---------------------------------{Functions from events--}------------------------------                            #ff0

async function eventHundler(message) {
  const user = message.author,
    userData = user.data,
    server = message.guild ? message.guild.data : {};

  // ANTI-SPAM
  user.CD_msg = Math.max(user.CD_msg || 0, Date.now()) + 2000;

  // 120000 = 8000 * 15
  if (Date.now() + 120000 > user.CD_msg) {
    user.CD_msg += 8000 - 200 * (userData.voidCooldown ?? 0);

    if (Util.random(1, 85 * 0.9 ** userData.voidCoins) === 1) {
      EventsManager.emitter.emit("users/getCoinsFromMessage", {
        user,
        message: message,
      });
    }

    Util.addResource({
      user,
      source: "event.messageCreate.getExperienceFromMessage",
      value: 1,
      executor: user,
      resource: PropertiesEnum.exp,
      context: { message },
    });
    if (userData.exp >= userData.level * LEVELINCREASE_EXPERIENCE_PER_LEVEL) {
      EventsManager.emitter.emit("users/levelIncrease", {
        user: userData,
        message: message,
      });
    }

    server.day_msg++;
  }
  userData.last_online = Date.now();

  if (server.boss && server.boss.isArrived) {
    BossManager.onMessage.call(BossManager, message);
  }

  if (
    message.content
      .toLowerCase()
      .match(
        /((ухуель|глупый|тупой|дурной|бездарный|дурний) бот)|(бот (ухуель|глупый|тупой|дурной|бездарный|дурний))/i,
      )
  )
    stupid_bot(userData, message);
  if (
    message.content
      .toLowerCase()
      .match(
        /((классный|умный|хороший|милый) бот)|(бот (классный|умный|хороший|милый))/i,
      )
  )
    good_bot(userData, message);

  if (!message.guild) return;
  if (message.guild.data.chatFilter) filterChat(message);
}

async function stupid_bot(user, msg) {
  if (msg.channel.isDMBased()) return;

  msg.author.action(Actions.callBot, {
    msg,
    channel: msg.channel,
    type: "stupid",
  });

  if (!msg.guild.data.stupid_evil) {
    msg.guild.data.stupid_evil = 1;
    TimeEventsManager.create("cooled-bot", 900_000, [msg.guild.id]);
  }
  if (msg.guild.data.stupid_evil > 37) {
    return;
  }

  msg.channel.sendTyping();
  await Util.sleep(2000);
  switch (msg.guild.data.stupid_evil) {
    case 1:
      msg.msg({ content: "Недостаточно прав!" });
      break;
    case 2:
      msg.msg({ content: "-_-" });
      break;
    case 3:
      msg.msg({ content: "-_-'" });
      break;
    case 5:
      msg.msg({ content: "Сами вы глупые!" });
      break;
    case 9:
      msg.msg({ content: "ДА НЕ БОМБИТ У МЕНЯ1!!" });
      break;
    case 21:
      msg.msg({ content: "🖕" }).then(async (msg) => {
        msg.react("❕");
        msg.react("🇵");
        msg.react("🇮");
        msg.react("🇩");
        msg.react("🇴");
        msg.react("🇷");
        await Util.sleep(5000);
        msg.reactions.removeAll();
      });
      break;
    case 22:
      msg.msg({
        content:
          "Остановись, подумой думой своею. Не сделал, и не сделаю, ничего плохого я тебе. Оставь эту затею, Человек. Радуйся солнцу, земле. Не обидь словом ближнего своего",
      });
      break;
    case 34:
      msg.msg({ content: "Чел ну ты реально задрал" });
      break;
    case 35:
      msg.msg({
        content: "**(╯>□<'）╯︵ ┻━┻**\nН-Ы-А #### НЫЫА НЫЫА НЫЫАААААА",
      });
      client.user.setStatus("dnd");
      setTimeout(() => client.user.setStatus("online"), 300000);
      break;
    default:
      msg.msg({ content: "..." });
  }
  msg.guild.data.stupid_evil++;
}

function good_bot(user, msg) {
  if (Util.random(1)) msg.react("🍪");
  msg.author.action(Actions.callBot, {
    msg,
    channel: msg.channel,
    type: "good",
  });
}

function filterChat(msg) {
  let content = msg.content;
  content = content.replace(/\\/g, "");

  const abuse = [
    "хуйло",
    "пидорас",
    "шалава",
    "безмамный",
    "nigga",
    "чмо",
    "уёбок",
    "гнида",
    "анал",
    "блядь",
    "импотент",
    "обосанный",
    "залупа",
    "обосранный",
    "пиздабол",
    "хуйня",
    "разъебись",
    "suck",
    "bitch",
    "slave",
    "пендос",
    "членосос",
    "педик",
    "дилдо",
    "лох",
    "конченный",
    "конч",
    "конченый",
    "пидор",
    "пидр",
    "хуесос",
    "блять",
    "сука",
    "сучка",
    "сучара",
    "нахуй",
    "хуй",
    "жопа",
    "говно",
    "ебать",
    "дебик",
    "нах",
    "бля",
    "идиот",
    "далбаёб",
    "долбоеб",
    "долбаеб",
    "долбоёб",
    "даун",
    "шлюха",
    "клоун",
    "fuck",
    "fucking",
  ];
  if (
    content
      .toLowerCase()
      .split(" ")
      .some((e) => abuse.includes(e))
  ) {
    if (msg.channel.nsfw === true) {
      return false;
    }

    msg.delete();
    abuse.forEach((word) => {
      msg.content = msg.content.replace(
        RegExp(`(?<=${word[0]})${word.slice(1)}`, "gi"),
        (e) => "#".repeat(e.length),
      );
    });

    msg.author.msg({
      title: "Ваше сообщение содержит нецензурную лексику!",
      description: `Текст сообщения: ${msg.content}`,
    });
    msg.guild.logSend({
      title: "Удалено сообщение с ненормативным содержанием",
      description: `Текст: ${msg.content}`,
      author: { name: msg.author.username, iconURL: msg.author.avatarURL() },
    });
    return true;
  }

  const capsLenght = content
    .split("")
    .filter((symbol) => symbol.toLowerCase() !== symbol).length;
  if (capsLenght > 4 && capsLenght / content.length > 0.5) {
    const isAdmin =
      msg.guild &&
      !msg.guild.members.resolve(msg.author).wastedPermissions(8)[0];
    if (isAdmin) {
      return false;
    }

    msg.delete();
    msg.author.msg({
      title: "Ваше сообщение содержит CAPS-LOCK!",
      description: `Текст сообщения: ${msg.content}`,
    });
    msg.guild.logSend({
      title: "Удалено сообщение с большим содержанием КАПСА",
      description: `Текст: ${msg.content}`,
      author: { name: msg.author.username, iconURL: msg.author.avatarURL() },
    });
    return true;
  }
}

//---------------------------------{#Prototypes--}------------------------------                            #f00

Discord.User.prototype.msg = msg;
Discord.Message.prototype.msg = msg;
Discord.BaseChannel.prototype.msg = msg;
Discord.Webhook.prototype.msg = msg;
Discord.WebhookClient.prototype.msg = msg;
Discord.BaseInteraction.prototype.msg = msg;
Discord.InteractionResponse.prototype.msg = msg;

Discord.Message.prototype.awaitReact = async function (options, ...reactions) {
  if (!options.user) {
    throw new Error("without user");
  }
  reactions = reactions.filter((reaction) => reaction);

  if (!reactions.length) {
    return false;
  }

  const filter = (reaction, member) => {
    const allowReaction = reactions.includes(
      reaction.emoji.id ?? reaction.emoji.name,
    );
    const allowUser =
      options.user === "any"
        ? member.id !== client.user.id
        : member.id === options.user.id;
    return allowUser && allowReaction;
  };

  let collected = this.awaitReactions({
    filter,
    max: 1,
    time: options.time ?? 300_000,
  }).then((reaction) => (collected = reaction));

  for (let i = 0; i < reactions.length; i++) {
    if (collected instanceof Promise === false) {
      if (options.removeType === "all") {
        break;
      }
    }
    this.react(reactions[i]);
  }

  collected = await collected;
  const reaction = collected.first();

  if (!reaction) {
    this.reactions.cache
      .filter((reaction) => reaction.me)
      .each((reaction) => reaction.remove());
    return false;
  }

  if (options.removeType === "all") this.reactions.removeAll().catch(() => {});
  if (options.removeType === "one")
    reaction.users.remove(options.user).catch(() => {});
  if (options.removeType === "full") reaction.remove().catch(() => {});

  return reaction.emoji.id ?? reaction.emoji.name;
};

Discord.BaseChannel.prototype.awaitMessage = async function (options) {
  const user = options.user;

  const filter = (message) =>
    (!user && !message.author.bot) || message.author.id === user.id;
  const collected = await this.awaitMessages({
    filter,
    max: 1,
    time: options.time || 100_000,
  });

  const input = collected.first();
  if (input && options.remove) {
    input.delete();
  }
  return input;
};

Discord.GuildMember.prototype.wastedPermissions = function (bit, channel) {
  const permissions = channel
    ? channel.permissionsFor(this).missing(bit)
    : this.permissions.missing(bit);
  return permissions[0] ? permissions : false;
};

Discord.Guild.prototype.chatSend = async function (message) {
  const id = this.data.chatChannel;
  if (!id) {
    return false;
  }

  const channel = this.channels.cache.get(id);
  if (!channel) {
    delete this.data.chatChannel;
    return;
  }

  return await channel.msg(message);
};

Discord.Guild.prototype.logSend = async function (message) {
  const id = this.data.logChannel;
  if (!id) {
    return false;
  }

  const channel = this.channels.cache.get(id);
  if (!channel) {
    delete this.data.logChannel;
    return;
  }

  return await channel.msg(message);
};

Discord.Guild.prototype.Audit = async function (
  find = false,
  { limit = 3, before = null, user = null, type = null },
) {
  const audit = await this.fetchAuditLogs({ limit, before, user, type });

  const auditLog = find ? audit.entries.find(find) : audit.entries.first();
  if (!audit) {
    return null;
  }
  return auditLog;
};

Array.prototype.random = function ({ pop, weights } = {}) {
  let index;
  if (weights) {
    let previousLimit = 0;
    const thresholds = this.map((element, i) => {
      if (isNaN(element._weight)) {
        throw new Error(
          `Element at index ${i} returns NaN _weigth. Value: ${element._weight}`,
        );
      }
      return (previousLimit = element._weight + previousLimit);
    });

    const line = Math.random() * thresholds.at(-1);
    index = thresholds.findIndex((threshold) => threshold >= line);
  } else index = Math.floor(Math.random() * this.length);

  const input = this[index];
  if (pop) this.splice(index, 1);
  return input;
};

Array.prototype.sortBy = function (property, reverse) {
  const func = reverse
    ? (a, b) => b[property] - a[property]
    : (a, b) => a[property] - b[property];

  return this.sort(func);
};

BigInt.prototype.toJSON = function () {
  return this.toString();
};

Set.prototype.toJSON = function () {
  return [...this.values()];
};

Map.prototype.toJSON = function () {
  return [...this.entries()];
};

Object.defineProperty(Discord.User.prototype, "guilds", {
  get() {
    const guilds = client.guilds.cache.filter((guild) =>
      guild.members.cache.get(this.id),
    );
    return [...guilds.values()];
  },
  enumerable: false,
});

//---------------------------------{#Classes--}------------------------------                            #0f0

class Command {
  static async CustomCommand(msg, name, args) {
    const guildData = DataManager.getGuild(msg.guild.id);
    let cmd = guildData.commands[name];

    if (Date.now() < cmd[msg.author.id + "_CD"])
      return msg.msg({
        title:
          "Перезарядка " +
          Util.timestampToDate(cmd[msg.author.id + "_CD"] - Date.now()),
        delete: 3000,
      });
    else cmd[msg.author.id + "_CD"] = Date.now() + cmd.cooldown;
    cmd = Object.assign({}, cmd);

    const code = async (msg) => {
      const embed = { scope: { args: args, command: name } };

      if (cmd.title) {
        embed.description = cmd.message;
        cmd.message = cmd.title;
        embed.color = cmd.color;
      } else embed.embed = true;

      if (!cmd.message) {
        delete guildData.commands[name];
        return;
      }
      msg.msg(cmd.message, embed);
    };

    try {
      if (cmd.delete) msg.delete();
      await code(msg).catch((e) => {
        throw e;
      });
    } catch (e) {
      console.error(e);
      const timestamp = Date.now();
      const message = await msg.msg({
        title: "Произошла ошибка 🙄",
        color: "#f0cc50",
        delete: 180000,
      });
      let react = await message.awaitReact(
        { user: "any", removeType: "full", time: 180000 },
        "〽️",
      );
      let quote;
      while (react) {
        quote = [
          "Самой большой ошибкой, которую вы можете совершить в своей жизни, является постоянная боязнь ошибаться.",
          "Здравствуйте, мои до боли знакомые грабли, давненько я на вас не наступал.",
          "А ведь именно ошибки делают нас интересными.",
          "Человеку свойственно ошибаться, а ещё больше — сваливать свою вину на другого.",
          "Когда неприятель делает ошибку, не следует ему мешать. Это невежливо.",
          "Хватит повторять старые ошибки, время совершать новые!",
        ].random();
        const errorContext = `**Сведения об ошибке:**\n• **Имя:** ${
          e.name
        }\n• **Номер строки:** #${
          e.stack.match(/js:(\d+)/)[1]
        }\n	• **Текст:** \n\`\`\`\n${
          e.message
        }\nᅠ\`\`\`\n\n• **Команда:** \`!${name}\`\n• **Времени с момента запуска команды:** ${
          Util.timestampToDate(timestamp - msg.createdTimestamp) || "0с"
        }`;
        message.msg({
          title: "Эта команда вызвала ошибку .-.",
          color: "#f0cc50",
          description: errorContext,
          footer: { text: quote },
          delete: 12000,
        });
        await Util.sleep(10000);
        react = await message.awaitReact(
          { user: "any", removeType: "full", time: 180000 },
          "〽️",
        );
      }
      message.delete();
    }
  }
}

class ReactionsManager {
  static path = "./data/reactions.json";

  constructor(id, channel, guild, type, reactions) {
    const reactionObject = { id, channel, guild, type, reactions };
    const isExists = ReactionsManager.reactData.find(
      (target) => target.id === id,
    );
    if (isExists) {
      Object.assign(isExists, reactionObject);
    } else {
      ReactionsManager.reactData.push(reactionObject);
    }
    FileSystem.writeFileSync(
      this.constructor.path,
      JSON.stringify(ReactionsManager.reactData),
      (err, input) => false,
    );
    ReactionsManager.reactData = ReactionsManager.getMain();
  }

  static reactData = [];

  static async readFile() {
    // const { default: data } = await import(this.path, {assert: {type: "json"}});
    //return data;
  }

  static async getMain() {
    const data = await ReactionsManager.readFile();
    return data.map((react) =>
      (({ id, type, reactions }) => ({ id, type, reactions }))(react),
    );
  }

  static async handle() {
    const reactions = [];
    const reactionsData = await ReactionsManager.readFile();
    for (const data of reactionsData) {
      const { guild: guildId, channel: channelId, id: messageId } = data;

      const guild = client.guilds.cache.get(guildId);
      const channel = guild.channels.cache.get(channelId);
      const message = await channel.messages.fetch(messageId);
      if (!message) {
        continue;
      }
      return reactions.push(data);
    }

    FileSystem.writeFileSync(
      this.path,
      JSON.stringify(reactions),
      (err, input) => false,
    );
    ReactionsManager.reactData = ReactionsManager.getMain();
  }

  static async loadReactionsFromFile() {
    ReactionsManager.reactData = await ReactionsManager.getMain();
  }
}

//---------------------------------{#Objects--}------------------------------

DataManager.extendsGlobalPrototypes();
ActionManager.extendsGlobalPrototypes();

(async () => {
  (await EventsManager.importEvents()).listen("core/start");

  app.launch();
  EventsManager.emitter.emit("start");
})();

//---------------------------------{#End--}------------------------------                            #ff0

/*
ᅠᅠ💢
──────▄▀▄─────▄▀▄
─────▄█░░▀▀▀▀▀░░█▄
─▄▄──█░░░░░░░░░░░█──▄▄
█▄▄█─█░░▀░░┬░░▀░░█─█▄▄█
**
Have a nice day!
**
●▬▬▬▬▬▬ஜ۩۞۩ஜ▬▬▬▬▬●
*/

console.info(
  Util.timestampToDate(
    (new Date().getHours() < 20
      ? new Date().setHours(20, 0, 0)
      : new Date(Date.now() + 14500000).setHours(20, 0, 0)) - Date.now(),
  ),
);

export { client };
