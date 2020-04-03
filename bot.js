// https://discordapp.com/oauth2/authorize?client_id=559291277074628619&scope=bot&permissions=1073741832
if (console.clear) console.clear();
console.time();


const
  Discord = require("discord.js"),
  BOT     = new Discord.Client(),
  OWNER   = "416701743733145612",
  SERVER  = "672732686535622666";

let
  fs   = require("fs"),
  data = require("./main/data.json");




BOT.on("ready", async (bot) => {
  await delay(100);


  BOT.guilds.cache.forEach(async el => el.invites = await el.fetchInvites());




//----------------------------------{Events and intervals--}------------------------------

  let tick_15 = BOT.setInterval(() => {
    let ii = 0;
    BOT.users.cache.forEach((el, i) => {
      if (el.presence.status != "offline") el.data().last_online = getTime();
    });
  }, 15000);

  function track_day(){
    if (new Date().getHours() > 19){
      setTimeout (() => {
        track_day();
      }, 14400000);
    }
    else {
      setTimeout (() => {
        BOT.guilds.cache.forEach((item) => {
          item.chatSend(embed(`За этот день было написано ${item.data().day_msg.ending("сообщени й е я")}`));
          item.data().day_msg = 0;
        });
        track_day();
      }, 72000000 - (new Date().getHours() * 3600000 + new Date().getMinutes() * 60000 + new Date().getSeconds() * 1000));
    }
  };
  track_day();

  await delay(100);

  BOT.on("message",  async (msg) => {
    if (msg.author.bot) return
    let
      user = msg.author.data(),
      server = msg.guild.data();
    if (random(1, 50) == 1) getCoinsFromMessage(user, msg);
    if (user.exp >= (user.level || 1) * 15) levelUp(user, msg);
    server.day_msg++ || 1;
    user.last_online = getTime();
    user.exp++ || 1;
    msg.author.quest("messagesFountain");

    data_save();
    commandHundler(msg);
  });
  BOT.on("messageUpdate",   async (oldMsg, msg) => commandHundler(msg));
  BOT.on("guildMemberAdd",  async (member)      => {
    member.guild.fetchInvites().then(guildInvites => {
        const old = member.guild.invites;
        member.guild.invites = guildInvites;
        const invite = guildInvites.find(i => old.get(i.code).uses < i.uses);
        console.log(invite);
    });
  });
  BOT.on("inviteCreate", async invite => {
    let guild = invite.guild;
    guild.invites = await guild.fetchInvites();
  });
  BOT.on("inviteDelete", async invite => {
    let guild = invite.guild;
    guild.invites = await guild.fetchInvites();
  });

  console.timeEnd();
  await delay(120);
  console.clear();
  console.log(`\n\n    Ready...\n\n`);

});

  //----------------------------------{Commands--}------------------------------


  function _seeend(args, msg) {
    eval(`msg.channel.send(embed(${args}))`);
    msg.delete();
  }

  function _eval(args, msg){
    if (msg.author.id != OWNER) return msg.channel.send(embed("Э, вы не хозяин -_-'", "ff0000"), console.log(msg.author.username + " пытался использовать !eval"));
    eval(args);
    msg.react("685057435161198594");
  }

  function _editUser(args, msg){
    if (msg.author.id != OWNER) return msg.channel.send(embed("Апасна, сожрет", "ff0000"));
    let memb = (msg.mentions.users.first()) ? msg.mentions.users.first() : msg.author;
    let user = memb.data();
    // не завершено
  }

// - - - - - - - - - { - Discord ONE love :З



  function _c(args, msg) {
    msg.channel.send(`**${args}**`);
    msg.delete();
  }
  const _с = (a, m) => _c(a, m);


  function _лайк(args, msg){
    msg.delete();
	  let mention = msg.mentions.users.first();
    msg.author.quest("like");
	  if (!mention) msg.channel.send(`**${msg.author} ценит мир и это прекрасно**`);
	  else if (mention == msg.author) msg.channel.send(`**${msg.author} похвалил себя, все с ним понятно -_-**`);
	  else {
		   msg.channel.send(`${msg.author} похвалил **${mention.username}а!**`);
	     mention.send(`Вас похвалил **${msg.author.username}**`);
	   }
  }
  const _like = (a, m) => _лайк(a, m);


  function _пред(args, msg){
  	let mention = msg.mentions.users.first();
  	if (!mention) msg.channel.send("Укажите пользователя.");
  	else if (mention == msg.author) msg.channel.send("Вы точно этого хотите?");
  	else {
  		 if (delete_spaces(args.replace(mention, ""))) msg.channel.send(`Участник ${msg.author} предупредил ${mention}\n **Причина:** ${args.replace(mention+" ", "")}`);
  	   else msg.channel.send(`${msg.author} выдал предупреждение ${mention} без объяснения причин`);
  	   mention.send(`Вам выдано предупреждение \n **Причина:** ${args.replace(mention + " ", "") || "**не указана**"}`);
  	}
  }
  const _warn = (a, m) => _пред(a, m);


  function _юзер(args, msg) {
    let
      memb   = (msg.mentions.users.first()) ? msg.mentions.users.first() : (args) ? BOT.users.cache.get(args) : msg.author,
      member = (msg.guild) ? msg.guild.member(memb) : false,
      user   = memb.data(),
      rank   = "",
      guild  = msg.guild,
      embed  = new Discord.MessageEmbed()
        .setAuthor(memb.username + "#" + memb.discriminator, memb.avatarURL())
        .setTitle("Профиль пользователя")
        .setColor(user.profile_color || random(0,16777212));
      if (member && user.level > 1) rank = data.users.filter((el) => (guild.members.cache.get(el.id)) ? !guild.members.cache.get(el.id).user.bot : false).sort((b, a) => (a.level != b.level) ? (a.level || 1) - (b.level || 1) : (a.exp || 0) - (b.exp || 0)).findIndex((el) => user.id == el.id) + 1;
      let status;
      if (memb.presence.status != "offline") status = "<:online:637544335037956096> В сети";
      else {
         let date = getTime() - (user.last_online || 2629744);
         let last_online = (date > 31556926000000) ? "более года" : (date > 2629743000) ? "более месяца" : timestampToDate(date);
         status = (last_online) ? "<:offline:637544283737686027> Не в сети " + last_online : "<:online:637544335037956096> В сети";
      }
      memb.quest("check")
      embed.setDescription(`Коинов: **${user.coins || 200}**<:coin:637533074879414272> \n <a:crystal:637290417360076822>Уровень: **${user.level || 1}** \n <:crys:637290406958202880>Опыт: **${user.exp || 0}/${(user.level || 1) * 15}** \n\n ${status} \n`)
      if (!user.praiseMe) user.praiseMe = [];
      if (member) embed.addField(" ᠌᠌", "\n**" + `${member.roles.highest}` + "**");
      embed.addField(" ᠌"," ᠌")
      .setFooter(` Похвал: ${user.praiseMe.length || "0"}   ${(rank) ? "Ранг: " + rank + "/" + guild.members.cache.filter((el) => el.user.data().level > 1).size : ""}`);
      if (!memb.bot) embed.addField("Квест:", (user.quest) ? quests[user.quest] + (user.questProgress || 0) + "/" + user.questNeed : " - Квест выполнен");
    msg.channel.send(embed);
  }
  const _user = (a, m) => _юзер(a, m);
  const _u    = (a, m) => _юзер(a, m);
  const _ю    = (a, m) => _юзер(a, m);


  async function _похвалить(args, msg){
    msg.delete();
    let memb = msg.mentions.users.first();
    if (!memb) return msg.channel.send(embed("Укажите пользователя"));
    let user = msg.author.data();
    let mention_user = memb.data();
    if (memb == msg.author) return msg.channel.send(embed("Выберите другую жертву объятий!"))
    let heAccpet = await accept("praise", "Количество похвал ограничено\nПродолжить?", msg, user);
    if (!heAccpet) return
    if (!user.praise) user.praise = [];
    if (user.praise.length > 2 + Math.floor(user.level / 10)) return msg.channel.send(embed("Вы использовали все похвалы", "ff0000"));
    if (!mention_user.praiseMe) mention_user.praiseMe = [];
    if (user.praise.includes(memb.id)) return msg.channel.send(embed("Вы уже хвалили его!"));
    user.praise.push(memb.id);
    mention_user.praiseMe.push(user.id);
    msg.channel.send(embed(`${memb.username} похвалили ${mention_user.praiseMe.length}-ый раз\nЭто сделал ${msg.author.username}!`));
    memb.quest("messagesFountain");
  }
  const _praise = (a, m) => _похвалить(a, m);


  async function _похвалы(args, msg){
    let
      memb = (msg.mentions.users.first()) ? msg.mentions.users.first() : msg.author,
      user = memb.data(),
      iPraise = (user.praise) ? user.praise.map((item, i) => (i + 1) + ". "+ ((BOT.users.cache.get(item)) ? BOT.users.cache.get(item).username : "пользователь не определен")).join(`\n`) : (memb == msg.author) ? "Вы никого не хвалили \nиспользуйте **!похвалить**" : "Никого не хвалил",
      mePraise = (user.praiseMe) ? user.praiseMe.map((item, i) => (i + 1) + ". "+ ((BOT.users.cache.get(item)) ? BOT.users.cache.get(item).username : "пользователь не определен")).join(`\n`) : (memb == msg.author) ? "Вас никто не похвалил, напомните им это сделать" : "Его никто не хвалил, похвалите его!";
    if (user.praise) if (user.praise.length < 2 + Math.floor(user.level / 10)) for(let i = 0; i < 0 + (2 + Math.floor(user.level / 10) - user.praise.length); i++) iPraise += `\n${user.praise.length + i + 1}. (пусто)`;
    let bot_msg = await msg.channel.send(embed((memb == msg.author) ? "Похвалы" : "Похвалил","00ffaf" , iPraise).setAuthor(memb.username + "#" + memb.discriminator, memb.avatarURL()).setFooter((memb == msg.author) ? `Если вы хотите отменить,\nпохвалу кликните на *галочку* ниже.` : "Have a good day"));
    bot_msg.call = msg;
    let react = (memb == msg.author) ? await bot_msg.awaitReact("640449832799961088", "685057435161198594") : await bot_msg.awaitReact("640449832799961088");
    let answer;
    while (true) {
      if (react == 640449832799961088){
         await bot_msg.edit(embed((memb == msg.author) ? "Вас похвалили" : "Был похвален", "00ffaf", mePraise).setAuthor(memb.username + "#" + memb.discriminator, memb.avatarURL()));
         react = await bot_msg.awaitReact("640449848050712587");
      }
      else if (react == 640449848050712587) {
        await bot_msg.edit(embed((memb == msg.author) ? "Похвалы" : "Похвалил","00ffaf" , iPraise).setAuthor(memb.username + "#" + memb.discriminator, memb.avatarURL()).setFooter((memb == msg.author) ? `Если вы хотите отменить,\nпохвалу кликните на *галочку* ниже.` : "Have a good goose"));
        if (memb == msg.author) react = await bot_msg.awaitReact("640449832799961088", "685057435161198594");
        else react = await bot_msg.awaitReact("640449832799961088");
      }
      else if (react == 685057435161198594) {
        await msg.channel.send(embed("Введите номер который вы хотите удалить, если вы передумали введите любой символ"));
        answer = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {max: 1, time: 10000});
        if (answer.first()){
           answer = Number(delete_spaces(answer.first().content));
           if (user.praise.length + 1 >= answer) {
             let index = BOT.users.cache.get(user.praise[answer - 1]).data().praiseMe.indexOf(String(user.id));
             await msg.channel.send(embed(`Вы удалили ${BOT.users.cache.get(user.praise[answer - 1]).username} из списка похвал`));
             if (index) BOT.users.cache.get(user.praise[answer - 1]).data().praiseMe.splice(index, 1);
             user.praise.splice(answer - 1, 1);
           }
           else await msg.channel.send(embed(`Введите число в диапазоне от 1 до ${user.praise.length} включительно`, "ffff00"));
        }
        else await msg.channel.send(embed("Время офф", "ffff00"));
        react = 640449848050712587;
      }
      else {
        msg.reactions.removeAll();
        return;
      }
    }
  }
  const _praises = (a, m) => _похвалы(a, m);



  // - - - - - - - - - { - Settings ( ＾◡＾)っ

  function _установитьчат(args, msg) {
    msg.delete();
    if (msg.channel.type == "dm") return msg.channel.send(embed("Вы не можете использовать это здесь.", "ff0000"));
    if (!msg.author.moderator(msg)) return msg.channel.send(embed("Недостаточно прав", "ff0000"));
    let server = msg.guild.data();
    server.chatChannel = msg.channel.id;
    msg.channel.send(embed(`#${msg.guild.channels.cache.get(msg.channel.id).name} канал стал чатом!`));
  }
  const _setchat = (a, m) => _установитьчат(a, m);

  function _установитьлоги(args, msg) {
    msg.delete();
    if (msg.channel.type == "dm") return msg.channel.send(embed("Вы не можете использовать это здесь.", "ff0000"));
    if (!msg.author.moderator(msg)) return msg.channel.send(embed("Недостаточно прав", "ff0000"));
    let server = msg.guild.data();
    server.logChannel = msg.channel.id;
    msg.channel.send(embed(`#${msg.guild.channels.cache.get(msg.channel.id).name} канал для логов`));
  }
  const _setlog = (a, m) => _установитьлоги(a, m);
  const _setlogs = (a, m) => _установитьлоги(a, m);

  async function _установитьновостной(args, msg) {
    msg.delete();
    if (msg.channel.type == "dm") return msg.channel.send(embed("Вы не можете использовать это здесь.", "ff0000"));
    if (!msg.author.moderator(msg)) return msg.channel.send(embed("Недостаточно прав", "ff0000"));
    if (!(await accept("newsChannel", "Жмякая реакцию вы соглашаетесь с тем, чтоб бот отправлял сообщения в этот канал", msg, msg.author.data()))) return false;
    let server = msg.guild.data();
    server.newsChannel = msg.channel.id;
    msg.channel.send(embed(`#${msg.guild.channels.cache.get(msg.channel.id).name} канал стал новостным`));
  }
  const _setnews = (a, m) => _установитьновостной(a, m);

  function _покинуть(args, msg) {
    let embed = new Discord.MessageEmbed()
      .setColor("00ff00")
      .setDescription("Эта бонусная функция доступна только для пользователей поддерживающих нас :green_heart: \nХотите быть одним из них? [**Поддержите нас!**](https://klike.net/uploads/posts/2019-07/1562915054_5.jpg)");
    msg.channel.send(embed);
  }

//----------------------------------{Functions--}------------------------------

if (fs.copyFile) fs.copyFile("./main/data.json", "./main/copy_data.json", (err) => {              //Создает копию данных & спасает жизнь
    if (err) console.log("Copy failed");
    console.log("\n");
});
else console.log("!Can't copy");


const
  data_save     = () => fs.writeFile("./main/data.json", JSON.stringify(data), (err, input) => {}),
  delete_spaces = (str) => str.split(" ").join(""),
  random        = (min, max) => Math.floor(Math.random() * (max - min)) + min,
  underfined    = () => console.log("underfined func"),                                            //При вызове не существующей функции не будет ошибки
  getTime       = () => new Date().getTime(),
  awaitFilter   = (reaction, memb) => true,
  embed         = (title, color, description) => new Discord.MessageEmbed().setColor(color || "00ff00").setTitle(title).setDescription(description || ""),
  delay         = (ms) => new Promise((response) => setTimeout(response, ms))


function delete_char(string, index){      //стрелочные функции не имеют agruments
  letters = string.split("");
  Array.from(arguments).slice(1).forEach((item, i) => letters[item] = "");
  return letters.join("");
};

function add_and(string){
  let arr = (string.includes("&s")) ? string.split("&s") : string.split(" ");
  if (arr.length == 1) return string.replace("&s", "");
  for (let i = 0; i < arr.length; i++) {
    if (!arr[i]) arr.splice(i, 1);
  }
  if (arr.length > 2) arr[arr.length - 1] = "и " + arr[arr.length - 1];
  return arr.join(" ");
}

function timestampToDate(date){
date /= 1000;
let
  keyWords = "дней дня день часов часа час минут минуты минуту секунд секунды секунду".split(" "),
  lastTime = Infinity,  //кто бы мог подумать, что это пригодится...
  i = 0,
  calc = (time) => {
    let fix = Infinity;
    let numb = Math.floor(date % lastTime / time);
    if (numb > 20) fix = 10;
    let index = (numb % fix > 4 || numb % fix == 0) ? 0 : (numb % fix > 1) ? 1 : 2;
    i++;
    lastTime = time;
    if (numb) return numb + " " + keyWords[(i - 1)* 3 + index] + "";
    else return "";
  },
  days    = calc(86400),
  hours   = calc (3600),
  minutes = calc(60),
  seconds = calc(1),
  input = add_and(days + "&s" + hours + "&s" + minutes + "&s" + seconds);
if (!days && !hours && !minutes  && !seconds) return 0;
return input;
};


function accept (name, text, msg, user){
  if (user[`${name}_first`]) return true
   return new Promise(async (resolve) => {
     let el = await msg.channel.send(embed(text));
     el.react("685057435161198594");
     let collected = await el.awaitReactions((reaction, member) => reaction.emoji.id == 685057435161198594 && member == msg.author, { max: 1, time: 10000 });
     el.delete();
     if (collected.first()) user[`${name}_first`] = 1;
     resolve (collected.first()) ? true : false;
  });
};



//---------------------------------{Functions from events--}------------------------------

function commandHundler(msg){
  if (msg.content[0] != "!") return false;
  if (msg.content[1] == " ") msg.content.delete_char(1);
  let
    trash = msg.content.split(" ")[0],
    command = trash.replace("!", "_").toLowerCase(),
    args = msg.content.replace(trash, "").replace(" ", "");
  try {
    eval(`${command}(args, msg)`);
  }
  catch (e) {
    if (e.name == "ReferenceError") return;
    console.dir(e);
  }
  finally {
    data_save();
  }
}

async function getCoinsFromMessage(user, msg){
  if (!user.coinsPerMessage) user.coinsPerMessage = 5;
  user.coins = (user.coins) ? user.coins + Number(user.coinsPerMessage) : 200 + Number(user.coinsPerMessage);
  let input = await msg.awaitReact("637533074879414272");
  if (!input) return console.log("$" + user.coins + " $+ " + user.coinsPerMessage + BOT.users.cache.get(user.id).username);
  let bot_msg = await msg.channel.send(`У вас **${user.coins.ending("коин ов  а")}**  :З`);
  bot_msg.delete({timeout: 2000});
};

async function levelUp(user, msg){
  if (!user.level) user.level = 1;
  user.exp -= user.level * 15;
  user.level++;
  let bot_msg = await msg.channel.send(`**${msg.author.username} получает ${user.level} уровень!**`);
  if (msg.channel.id != msg.guild.data().chatChannel) bot_msg.delete({timeout: 5000});
};

function quest(name){
  if (this.bot) return;
  let user   = this.data();
  let time   = Math.floor(getTime() / 86400000);
  let quests = "messagesFountain&30&1 like&2&1 praiseMe&1&5".split(" ");
  if (user.quest == undefined || user.questTime != time) {
    if (user.questTime == time) return;
    !function newQuest(){
      let chance = random(1,5);
      let npc = quests.random(true).split("&"); // name progress chance
      if (npc[2] > chance || npc[0] == user.questLast) return newQuest();
      user.quest         = npc[0];
      user.questProgress = 0;
      user.questNeed     = Math.max((npc[1] > 5) ? Math.floor((npc[1] * (Math.random() + 0.5)) / 5) * 5 : Math.round(npc[1] * (Math.random() + 0.5)), 1);
      user.questReward   = user.questNeed / npc[1];
      user.questTime     = Math.floor(getTime() / 86400000);
    }();
  };
  if (user.quest == name){
    user.questProgress = ++user.questProgress || 1;
    if (user.questProgress >= user.questNeed){
      user.questLast = name;
      user.quest = undefined;
      user.exp += Math.round(user.level * 15 / 5 * user.questReward);
      this.send(embed("Вы выполниили сегоднешний квест и получили опыт, пока-пока"))
    };
  };
};

//---------------------------------{#Prototypes--}------------------------------

Discord.Message.prototype.awaitReact = function(react){
  let user = (this.call) ? this.call.author : this.author;
  return new Promise(async (resolve) => {
    Array.from(arguments).forEach(async (item) => {
      await this.react(item);
    });
    let collected = await this.awaitReactions((reaction, member) => member == user && reaction.me, { max: 1, time: 100000 });
    await this.reactions.removeAll();
    let input = (collected.first()) ? collected.first().emoji.id : false;
    resolve (input);
 });
};

Discord.GuildMember.prototype.moderator = function(){
  return this.hasPermission("MANAGE_MESSAGES") || this.id == OWNER;
}

Discord.User.prototype.moderator = function(msg){
  return msg.guild.member(this).hasPermission("MANAGE_MESSAGES");
}

Discord.User.prototype.quest = quest;

Discord.Guild.prototype.chatSend = function(msg){
  if (!this.data().chatChannel) return false;
  this.channels.cache.get(this.data().chatChannel).send(msg);
}

Discord.Guild.prototype.logSend = function(msg){
  if (!this.data().logChannel) return false;
  this.channels.cache.get(this.data().logChannel).send(msg);
}

Discord.Guild.prototype.newsSend = async function(msg){
  if (!this.data().newsChannel) return false;
  this.channels.cache.get(this.data().newsChannel).send(msg);
}

Discord.Guild.prototype.data = function() {
    if (!data.guilds.find((el) => el.id == this.id)) data.guilds.push({"id": this.id});
    return data.guilds.find((el) => el.id == this.id);
}

Discord.User.prototype.data = function() {
    if (!data.users.find((el) => el.id == this.id)) data.users.push({"id": this.id});
    return data.users.find((el) => el.id == this.id);
}


String.prototype.delete_char = function(index){
  letters = this.split("");
  Array.from(arguments).forEach((item, i) => letters[item] = "");
  return letters.join("");
}

String.prototype.ending = function(item, opt) {
  opt = opt.split(" ");
  let numb = Number(this);
  let fix = Infinity;
  if (this > 20) fix = 10;
  let end = (this % fix > 4 || this % fix == 0) ? opt[1] : (this % fix > 1) ? opt[3] : opt[2];
  return this + ` ${opt[0] + end}`
}

Number.prototype.ending = function(opt) {
  opt = opt.split(" ");
  let fix = Infinity;
  if (this > 20) fix = 10;
  let end = (this % fix > 4 || this % fix == 0) ? opt[1] : (this % fix > 1) ? opt[3] : opt[2];
  return this + ` ${opt[0] + end}`
}

Array.prototype.random = function(pop){
    let input = this[Math.floor(Math.random() * this.length)];
    if (pop) this.slice(this.indexOf(input), 1);
    return input;
};

//---------------------------------{#Objects--}------------------------------

const quests = {
  undefined: "Квесты выполнены ",
  messagesFountain: "Отправьте сообщения ",
  like: "Лайкните этот мир и его существ ",
  praiseMe: "Дождитесь пока вас похвалят :З "

}


//---------------------------------{#End--}------------------------------


setTimeout(() => BOT.login("NTU5MjkxMjc3MDc0NjI4NjE5.XjbaEw.zLCm0QVJD3tS8pcvPKbBzttQs8s"), 100);

if (!fs.copyFile) console.log(`⁰¹⁰⁰⁰¹¹¹ ⁰¹¹⁰¹¹¹¹ ⁰¹¹⁰¹¹¹¹ ⁰¹¹⁰⁰¹⁰⁰  ⁰¹⁰⁰¹¹⁰⁰ ⁰¹¹¹⁰¹⁰¹ ⁰¹¹⁰⁰⁰¹¹ ⁰¹¹⁰¹⁰¹¹ \n`);
data_save();



/*
ᅠᅠ💢
──────▄▀▄─────▄▀▄
─────▄█░░▀▀▀▀▀░░█▄
─▄▄──█░░░░░░░░░░░█──▄▄
█▄▄█─█░░▀░░┬░░▀░░█─█▄▄█
**
𝗨𝗦𝗘𝗥
- coinsPerMessage <:coin:637533074879414272>
- coins <:coin:637533074879414272>
- warn
- exp <:crys:637290406958202880>
- level <a:crystal:637290417360076822>
- profileColor
- profileAbout <a:who:638649997415677973>
- prises
- prisesMe
- reports
- clicker_upCost
- MG
- MGall
- MemberTime
- EmbedMode

𝗚𝗨𝗜𝗟𝗗
- chatChannel
- day_msg
**
●▬▬▬▬▬▬ஜ۩۞۩ஜ▬▬▬▬▬●


!𝗥𝗨𝗟𝗘𝗦
server = guild.data()
guild  = BOT.guilds
user   = memb.data();
member = BOT.guilds.users!
memb   = BOT.users!
*/
