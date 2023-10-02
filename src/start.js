console.clear();

import 'dotenv/config';

import Discord, { BaseInteraction } from 'discord.js';

import * as Util from '#lib/util.js';
import { Template, DataManager, BossManager, CurseManager, TimeEventsManager, CommandsManager, QuestManager, ActionManager, CounterManager, ErrorsHandler, EventsManager } from '#lib/modules/mod.js';
import { CreateMessage } from '@zoodogood/utils/discordjs';
import client from '#bot/client.js';
import config from '#config';


import app from '#app';
import FileSystem from "fs";
import { Actions } from '#lib/modules/ActionManager.js';
import { LEVELINCREASE_EXPERIENCE_PER_LEVEL } from '#constants/users/events.js';






client.on("ready", async () => {
  client.guilds.cache.forEach(async guild => guild.invitesCollection = await guild.invites.fetch().catch(() => {}));

  if (config.development) {
    client.user.setActivity("Кабзец тебе, Хозяин", {type: "STREAMING", url: "https://www.twitch.tv/monstercat"});
  }
  else {
    client.user.setActivity("намана", {type: "WATCHING"});
  }




//----------------------------------{Events and intervals--}------------------------------                            #0bf


  client.on("messageCreate", async message => {

    DataManager.data.bot.messagesToday++;
    
    if (message.author.bot) {
      return;
    }

    message.author.action(Actions.messageCreate, message);

    eventHundler(message);
    const commandContext = CommandsManager.parseInputCommandFromMessage(message);
    const command = commandContext?.command;
    if (commandContext && CommandsManager.checkAvailable(command, commandContext)){
      CommandsManager.execute(command, commandContext);
    }

  });

  client.on("inviteCreate", async (invite) => {
    let guild = invite.guild;
    guild.invitesCollection = await guild.invites.fetch();
  });

  client.on("inviteDelete", async (invite) => {
    //let guild = invite.guild;
  });

  client.on("guildCreate", async (guild) => {
    let members = guild.members.cache.filter(e => !e.user.bot);
    let whoAdded = await guild.Audit(e => e.target.id === client.user.id, {type: "BOT_ADD"});
    whoAdded = whoAdded ? whoAdded.target : null;

    const DEVELOPER_CHAT_ID = "763637440174227506";
    const developerChat = client.channels.cache.get(DEVELOPER_CHAT_ID);
    if (developerChat){
      const title = `Бот присоеденился к серверу ${ guild.name }!`;
      const description = `Участников: ${ members.size }\nКол-во знакомых боту людей: ${members.filter(member => DataManager.data.users.some(user => user.id === member.id)).size}\nПригласил пользователь этого сервера?: ${whoAdded && guild.members.resolve(whoAdded) ? "Да" : "Нет"}.`;
      developerChat.msg({title, description, footer: {text: `Серверов: ${client.guilds.cache.size}`}});
    }
    
    guild.invitesCollection = await guild.invites.fetch();
    DataManager.data.bot.newGuildTimestamp = Date.now();
  });

  client.on("guildDelete", async (guild) => {
    client.users.cache.get("921403577539387454").msg({title: `Бота забанили на сервере ${guild.name}!`});
  })

  client.on("messageReactionAdd", async (reaction, user) => {

    if (reaction.emoji.name === "👍"){
      const target = (await reaction.message.fetch({force: false}))
        .author;

      user.action(Actions.likedTheUser, {target, likeType: "reaction", reaction});
    }

    const guildData = client.guilds.cache.get(reaction.message.guildId);

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
          reaction.message.msg({title: "Не удалось найти роль, вероятно она удалена", color: "#ff0000", delete: 7000});
          reaction.remove();
          return;
        }
        reaction.message.guild.members.resolve(user).roles.add(role);
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
        if (!role) reaction.message.msg({title: "Не удалось найти роль, вероятно она удалена", color: "#ff0000", delete: 7000});
        reaction.message.guild.members.resolve(user).roles.remove(role);
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
      // to-do fix
      return;
      guild.logSend({title: "Добавлен бот", author: {iconURL: e.user.avatarURL(), name: e.user.tag}, description: `Название: ${e.user.username}\n${e.user.flags.has("VERIFIED_BOT") ? "Верифицирован 👌" : "Ещё не верифицирован ❗"}\nКоличество серверов: \`неизвестно\`\n\n${whoAdded ? `Бота добавил: ${whoAdded.executor.username}` : ""}`, footer: {text: `Предоставленные права: ${permissions[0] + permissions.slice(1).toLowerCase()}`}});
      return;
    }

    const guildInvites = await guild.invites.fetch();

    
    const old = guild.invitesCollection;
    guild.invitesCollection = guildInvites;
    const invite = guildInvites.find(i => old.get(i.code).uses < i.uses);


    if (invite){
      const inviter = invite.inviter;
      guild.logSend({title: "Новый участник!", description: "Имя: " + e.user.tag + "\nИнвайтнул: " + inviter.tag + "\nПриглашение использовано: " + invite.uses, footer: {text: "Приглашение создано: "}, timestamp: invite.createdTimestamp});

      if (e.id !== inviter.id)
        inviter.action(Actions.globalQuest, {name: "inviteFriend"});

      inviter.data.invites = (inviter.data.invites ?? 0) + 1;
    }





    if (guild.data.hi && guild.data.hiChannel){
      let channel = guild.channels.cache.get(guild.data.hiChannel);
      if (!channel) {
        return;
      }

      channel.sendTyping();
      await Util.sleep(3500);
      await channel.msg({title: "На сервере появился новый участник!", color: guild.data.hi.color, image: guild.data.hi.image, description: guild.data.hi.message, scope: {tag: e.user.toString(), name: e.user.username}});
      channel.msg({content: "👋", delete: 150000});

      if (guild.data.hi.rolesId && !leaveRoles){
        roles = guild.data.hi.rolesId.map(el => guild.roles.cache.get(el)).filter(el => el);
        // let attempts = 0;
        // let acceptedRules = false;
        // while (attempts < 100){
        //   if (e.roles.cache.find(e => e.name === "everyone")){
        //     acceptRules = true;
        //     break;
        //   }
        //   await Util.sleep(3000);
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
      {content: `Участник был ${banInfo.action == "MEMBER_KICK" ? "кикнут" : "забанен"}`, description: `${ name }\nВыгнавший с сервера: ${e.guild.members.resolve(banInfo.executor).displayName} ${ JSON.stringify(reason()).slice(0, 1000) }`} :
      {content: "Участник покинул сервер", description: `${ name }\nНадеемся, он скоро вернётся`};

    e.guild.logSend({title: message.content, description: message.description, color: banInfo ? "#ff0000" : "#00ff00"});
  });
  
  

  client.on("userUpdate", async (old, user) => {
    if (old.avatar === user.avatar){
      return;
    }
    user.guilds.forEach(guild => guild.logSend({title: `${guild.members.resolve(user).displayName} изменил свой аватар`, author: {name: user.username, iconURL: user.avatarURL({dynamic: true})}, description: "", footer: {text: "Старый аватар", iconURL: old.displayAvatarURL({dynamic: true})}}));
  });
});



//----------------------------------{Functions--}------------------------------                            #0f0





async function msg(options, ..._devFixParams){
  if (_devFixParams.length > 0){
    console.log(message, options);
    throw new Error("Incorrect message input. Need to fix!");
  }

  options.color ||= config.development ? "#000100" : "#23ee23";

  const messagePayload = CreateMessage(options);
  const target = this instanceof Discord.Message && !options.edit ? this.channel : this;
  
  const message = target instanceof BaseInteraction ? 
    await (
      options.edit ?
          (target.replied ? target.editReply(messagePayload) : target.update(messagePayload))
        : (target.reply(messagePayload))
    ) :
    await (
      options.edit ?
          target.edit(messagePayload)
        : target.send(messagePayload)
    );


  if (options.delete){
    setTimeout(() => message.delete(), options.delete);
  }

  if (options.reactions){
    options.reactions.filter(Boolean).forEach(react => message.react(react));
  }

  return message;
};



//---------------------------------{Functions from events--}------------------------------                            #ff0



async function eventHundler(msg){
  let
    author = msg.author,
    user   = author.data,
    server = (msg.guild) ? msg.guild.data : {};

  // ANTI-SPAM
  author.CD_msg = Math.max( author.CD_msg || 0 , Date.now()) + 2000;

  // 120000 = 8000 * 15
  if (Date.now() + 120000 > author.CD_msg){
    author.CD_msg += (8000 - 200 * (user.voidCooldown ?? 0));

    if (Util.random(1, 85 * 0.90 ** user.voidCoins) === 1){
      EventsManager.emitter.emit("users/getCoinsFromMessage", {userData: user, message: msg});
    }

    user.exp++;
    if (user.exp >= user.level * LEVELINCREASE_EXPERIENCE_PER_LEVEL){
      EventsManager.emitter.emit("users/levelIncrease", {user, message: msg});
    }

    server.day_msg++;
  }
  user.last_online = Date.now();


  if (server.boss && server.boss.isArrived){
    BossManager.onMessage.call(BossManager, msg);
  }


  if (msg.content.toLowerCase().match(/((ухуель|глупый|тупой|енот|дурной|бездарный) бот)|(бот (ухуель|енот|глупый|тупой|дурной|бездарный))/i)) stupid_bot(user, msg);
  if (msg.content.toLowerCase().match(/((классный|умный|хороший|милый) бот)|(бот (классный|умный|хороший|милый))/i)) good_bot(user, msg);

  if (!msg.guild) return;
  if (msg.guild.data.chatFilter) filterChat(msg);
}




async function stupid_bot(user, msg) {
  if (msg.channel.isDMBased())
    return;

  msg.author.action(Actions.callBot, {msg, channel: msg.channel, type: "stupid"});

  if (!msg.guild.data.stupid_evil) {
    msg.guild.data.stupid_evil = 1;
    TimeEventsManager.create("cooled-bot", 900000, [msg.guild.id]);
  }
  if (msg.guild.data.stupid_evil > 37) {
    return;
  }

  msg.channel.sendTyping();
  await Util.sleep(2000);
  switch (msg.guild.data.stupid_evil) {
    case 1: msg.msg({content: "Недостаточно прав!"});
    break;
    case 2: msg.msg({content: "-_-"});
    break;
    case 3: msg.msg({content: "-_-'"});
    break;
    case 5: msg.msg({content: "Сами вы глупые!"});
    break;
    case 9: msg.msg({content: "ДА НЕ БОМБИТ У МЕНЯ1!!"});
    break;
    case 21: msg.msg({content: "🖕"}).then(async msg => {
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
    case 22: msg.msg({content: "Остановись, подумой думой своею. Не сделал, и не сделаю, ничего плохого я тебе. Оставь эту затею, Человек. Радуйся солнцу, земле. Не обидь словом ближнего своего"});
    break;
    case 34: msg.msg({content: "Чел ну ты реально задрал"});
    break;
    case 35: msg.msg({content: "**(╯>□<'）╯︵ ┻━┻**\nН-Ы-А #### НЫЫА НЫЫА НЫЫАААААА"});
      client.user.setStatus("dnd");
      setTimeout(() => client.user.setStatus("online"), 300000);
    break;
    default: msg.msg({content: "..."})
  }
  msg.guild.data.stupid_evil++;
};

async function mute(member, off = false){
  let guild = member.guild;

  if (off === true){
    guild.channels.cache.each(async channel => {
      await channel.permissionOverwrites.edit(member, {SEND_MESSAGES: null, ADD_REACTIONS: null, SPEAK: null});
      let {allow, deny} = channel.permissionOverwrites.get(member.id) || {allow: {}, deny: {}};

      if (allow.bitfield === 0 && deny.bitfield === 0)
        channel.permissionOverwrites.get(member.id).delete();

    });
    return;
  }

  guild.channels.cache.each(async channel => {
    // let pastPermissions = channel.permissionOverwrites.get(memb.id);
    // let {allow, deny} = pastPermissions || {};
    await channel.permissionOverwrites.edit(member, {
      SEND_MESSAGES: false,
      ADD_REACTIONS: false,
      SPEAK: false
    });
  });

}

function good_bot(user, msg){
  if (Util.random(1)) msg.react("🍪");
  msg.author.action(Actions.callBot, {msg, channel: msg.channel, type: "good"});
}


function filterChat(msg){
  let content = msg.content;
  content = content.replace(/\\/g, "");


  let abuse = ["хуйло", "пидорас", "шалава", "безмамный", "nigga", "чмо",  "уёбок",  "гнида", "анал", "блядь", "импотент", "обосанный", "залупа", "обосранный", "пиздабол", "хуйня", "разъебись", "suck", "bitch", "slave", "пендос", "членосос", "педик", "дилдо", "лох", "конченный", "конч", "конченый", "пидор", "пидр", "хуесос", "блять", "сука", "сучка", "сучара", "нахуй", "на хуй", "хуй", "жопа", "говно", "ебать", "дебик", "нах", "бля", "идиот", "далбаёб", "долбаёб", "долбаеб", "долбоёб", "даун", "шлюха", "клоун", "fuck", "fucking"];
  if ( content.toLowerCase().split(" ").some(e => abuse.includes(e)) ) {

    if (msg.channel.nsfw === true){
      return false;
    }

    msg.delete();
    abuse.forEach(word => {
      msg.content = msg.content.replace( RegExp(`(?<=${word[0]})${word.slice(1)}`, "gi"), e => "#".repeat(e.length) );
    });

    msg.author.msg({title: "Ваше сообщение содержит нецензурную лексику!", description: `Текст сообщения: ${ msg.content }`});
    msg.guild.logSend({title: "Удалено сообщение с ненормативным содержанием", description: `Текст: ${msg.content}`, author: {name: msg.author.username, iconURL: msg.author.avatarURL()}});
    return true;
  }



  let capsLenght = content.split("").filter(e => e.toLowerCase() != e).length;
  if (capsLenght > 4 && capsLenght / content.length > 0.5){

    let isAdmin = msg.guild && !msg.guild.members.resolve(msg.author).wastedPermissions(8)[0];
    if (isAdmin){
      return false;
    }

    msg.delete();
    msg.author.msg({title: "Ваше сообщение содержит CAPS-LOCK!", description: `Текст сообщения: ${  msg.content }`});
    msg.guild.logSend({title: "Удалено сообщение с большим содержанием КАПСА", description: `Текст: ${msg.content}`, author: {name: msg.author.username, iconURL: msg.author.avatarURL()}});
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


Discord.Message.prototype.awaitReact = async function(options, ...reactions){
  if (!options.user){
    throw new Error("without user");
  }
  reactions = reactions.filter(reaction => reaction);

  if (!reactions.length){
    return false;
  }

  const filter = (reaction, member) => {
    const allowReaction = reactions.includes(reaction.emoji.id ?? reaction.emoji.name);
    const allowUser = options.user === "any" ? member.id !== client.user.id : member.id === options.user.id;
    return allowUser && allowReaction;
  }

  let collected = this.awaitReactions({ filter, max: 1, time: options.time ?? 300_000 })
    .then(reaction => collected = reaction);

  for (let i = 0; i < reactions.length; i++){
    if (collected instanceof Promise === false){
      if (options.removeType === "all"){
        break;
      }
      
    }
    this.react(reactions[i]);
  }

  collected = await collected;
  const reaction = collected.first();

  if (!reaction){
    this.reactions.cache.filter(reaction => reaction.me).each(reaction => reaction.remove());
    return false;
  }

  if (options.removeType === "all")    this.reactions.removeAll();
  if (options.removeType === "one")    reaction.users.remove(options.user);
  if (options.removeType === "full")   reaction.remove();

  return reaction.emoji.id ?? reaction.emoji.name;
}

Discord.BaseChannel.prototype.awaitMessage = async function(options){
  const user = options.user;

  const filter = message => (!user && !message.author.bot) || message.author.id === user.id;
  const collected = await this.awaitMessages({filter, max: 1, time: options.time || 100_000});

  const input = collected.first();
  if (input && options.remove){
    input.delete();
  }
  return input;
}

Discord.GuildMember.prototype.wastedPermissions = function(bit, channel){
  let permissions = channel ? channel.permissionsFor(this).missing(bit) : this.permissions.missing(bit);
  return permissions[0] ? permissions : false;
}

Discord.Guild.prototype.chatSend = async function(message){
  let id = this.data.chatChannel;
  if (!id) {
    return false;
  }

  let channel = this.channels.cache.get(id);
  if (!channel) {
    delete this.data.chatChannel;
    return;
  }

  return await channel.msg(message);
}

Discord.Guild.prototype.logSend = async function(message){
  let id = this.data.logChannel;
  if (!id) {
    return false;
  }

  let channel = this.channels.cache.get(id);
  if (!channel) {
    delete this.data.logChannel;
    return;
  }

  return await channel.msg(message);
}

Discord.Guild.prototype.Audit = async function(find = false, {limit = 3, before = null, user = null, type = null}){
  // to-do: fix
  // const audit = await this.fetchAuditLogs({limit, before, user, type});
  return null;
  let auditLog = find ? audit.entries.find(find) : audit.entries.first();
  if (!audit){
    return null;
  }
  return auditLog;
}

Array.prototype.random = function({pop, weights} = {}){
  let index;
  if (weights) {
    let previousLimit = 0;
    const thresholds = this.map((element, i) => {
      if (isNaN(element._weight)){
        throw new Error(`Element at index ${ i } returns NaN _weigth. Value: ${ element._weight }`);
      }
      return previousLimit = element._weight + previousLimit;
    });
    
    

    const line = Math.random() * thresholds.at(-1);
    index = thresholds.findIndex(threshold => threshold >= line);
  }
  else index = Math.floor(Math.random() * this.length);

  let input = this[index];
  if (pop) this.splice(index, 1);
  return input;
}


Array.prototype.sortBy = function(property, reverse){
  const func = reverse ?
    ((a, b) => b[property] - a[property]) :
    ((a, b) => a[property] - b[property]) ;

  return this.sort(func);
}

BigInt.prototype.toJSON = function(){
  return this.toString();
}



Object.defineProperty(Discord.User.prototype, "guilds", {get(){
  let guilds = client.guilds.cache.filter(guild => guild.members.cache.get(this.id));
  return [...guilds.values()];
}});



//---------------------------------{#Classes--}------------------------------                            #0f0




class Command {
  

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
    const guildData = DataManager.getGuild(msg.guild.id);
    let cmd = guildData.commands[name];

    if (Date.now() < cmd[msg.author.id + "_CD"]) return msg.msg({title: "Перезарядка " + Util.timestampToDate(cmd[msg.author.id + "_CD"] - Date.now()), delete: 3000});
    else cmd[msg.author.id + "_CD"] = Date.now() + cmd.cooldown;
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
        delete guildData.commands[name];
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
      let timestamp = Date.now();
      let message = await msg.msg({title: "Произошла ошибка 🙄", color: "#f0cc50", delete: 180000});
      let react = await message.awaitReact({user: "any", removeType: "full", time: 180000}, "〽️");
      let quote;
      while (react){
        quote = ["Самой большой ошибкой, которую вы можете совершить в своей жизни, является постоянная боязнь ошибаться.", "Здравствуйте, мои до боли знакомые грабли, давненько я на вас не наступал.", "А ведь именно ошибки делают нас интересными.", "Человеку свойственно ошибаться, а ещё больше — сваливать свою вину на другого.", "Когда неприятель делает ошибку, не следует ему мешать. Это невежливо.", "Хватит повторять старые ошибки, время совершать новые!"].random();
        let errorContext = `**Сведения об ошибке:**\n• **Имя:** ${e.name}\n• **Номер строки:** #${e.stack.match(/js:(\d+)/)[1]}\n	• **Текст:** \n\`\`\`\n${e.message}\nᅠ\`\`\`\n\n• **Команда:** \`!${command}\`\n• **Времени с момента запуска команды:** ${Util.timestampToDate(timestamp - msg.createdTimestamp) || "0с"}`
        message.msg({title: "Эта команда вызвала ошибку .-.", color: "#f0cc50", description: errorContext, footer: {text: quote}, delete: 12000});
        await Util.sleep(10000);
        react = await message.awaitReact({user: "any", removeType: "full", time: 180000}, "〽️");
      }
      message.delete();
    }
  }
}





class ReactionsManager {

  static path = "./data/reactions.json";
  
  constructor (id, channel, guild, type, reactions){
    let reactionObject = {id, channel, guild, type, reactions};
    let isExists = ReactionsManager.reactData.find(e => e.id == id);
    if (isExists){
      Object.assign(isExists, reactionObject);
    }
    else {
      ReactionsManager.reactData.push(reactionObject);
    }
    FileSystem.writeFileSync(this.constructor.path, JSON.stringify(ReactionsManager.reactData), (err, input) => false);
    ReactionsManager.reactData = ReactionsManager.getMain();
  }

  static reactData = [];

  static async readFile(){
    // const { default: data } = await import(this.path, {assert: {type: "json"}});
    //return data;
  }

  static async getMain(){
    const data = await ReactionsManager.readFile()
    return data.map( react => (({id, type, reactions}) => ({id, type, reactions}))(react) );
  }

  static async handle(){
    let reactions = [];
    const reactionsData = await ReactionsManager.readFile();
    for (const data of reactionsData){
      const {guild: guildId, channel: channelId, id: messageId} = data;

      const guild = client.guilds.cache.get(guildId);
      const channel = guild.channels.cache.get(channelId);
      let message = await channel.messages.fetch(messageId);
      if (!message){
        continue;
      }
      return reactions.push(data);
    }

    FileSystem.writeFileSync(this.path, JSON.stringify(reactions), (err, input) => false);
    ReactionsManager.reactData = ReactionsManager.getMain();
  }
  
  static async loadReactionsFromFile(){
    ReactionsManager.reactData = await ReactionsManager.getMain();
  }
}












//---------------------------------{#Objects--}------------------------------



DataManager.extendsGlobalPrototypes();
ActionManager.extendsGlobalPrototypes();

(async () => {
  (await EventsManager.importEvents())
    .listen("core/start");

  app.launch();
  process.emit("start");
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


console.info(Util.timestampToDate(
  (new Date().getHours() < 20 ?
    new Date().setHours(20, 0, 0) : 
    new Date(Date.now() + 14500000).setHours(20, 0, 0)
  )
  - Date.now()
));



export { client };