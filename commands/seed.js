import * as Util from '#src/modules/util.js';
import { client } from '#src/index.js';
import DataManager from '#src/modules/DataManager.js';

class Command {

	async onChatInput(msg, interaction){
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
      server.berrys = Math.min( (server.berrys ?? 0) + (timePassed / 86400000) * speedGrowth, speedGrowth * 360 );

      let grow = speedGrowth > 100 ? {type: "минуту", count: speedGrowth / 1440} : speedGrowth > 10 ? {type: "час", count: speedGrowth / 24} : {type: "день", count: speedGrowth};
      fields.push({name: "Урожай", value: `Клубники выростает ${grow.count} в ${grow.type}\nГотово для сбора: ${Math.floor(server.berrys)}\nСледущая дозреет через: ${Util.timestampToDate((1 - server.berrys % 1) * 86400000 / speedGrowth)} <:berry:756114492055617558>`});

      let entrySeeds = server.treeSeedEntry || 0;
      fields.push({name: "Дерево", value: `Уровень деревца ${ level } ${level === 20 ? "(Максимальный)" : `\nДо повышения нужно ${costsUp - entrySeeds > 5 ? costsUp - entrySeeds : ["ноль", "одно", "два", "три", "четыре", "пять"][costsUp - entrySeeds]} ${Util.ending(costsUp - entrySeeds, "сем", "ян", "ечко", "ечка", {unite: (_quantity, word) => word})}` }`});

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
      timePassed = (Date.now() - server.treeEntryTimestamp) || 0;
      server.treeEntryTimestamp = Date.now();
      fillEmbed();
    }
    else {
      fields.push({name: "Общая инфомация", value: "Ему ещё предстоит вырасти, будучи семечком дерево не может давать плоды.\nОбязательно посадите семя, если оно у вас есть.\n\n❓ Выполняя каждый 50-й квест вы получаете по две штуки"});
      timePassed = (Date.now() - server.treeEntryTimestamp) || 0;
    }

    let embed = {
      title: "Живое, клубничное дерево",
      thumbnail: thumbnailArray[ Math.ceil(level / 4) ],
      description: `Это растение способно принести океан клубники за короткий срок. Для этого заботьтесь о нём: общайтесь на сервере, поддерживайте ламповую атмосферу, проводить время весело и следите, чтобы дерево не засохло.`,
      fields: fields,
      footer: {text: "Ваши сообщения используются для полива растений и полностью заменяют собой воду", iconURL: "https://emojipedia-us.s3.amazonaws.com/source/skype/289/sweat-droplets_1f4a6.png"}
    };

    let message = await msg.msg(embed);



    if (level !== 20){
      await message.react("🌱");
    }

    if (server.berrys >= 1){
      await message.react("756114492055617558");
    }

    let collector = message.createReactionCollector({filter: (r, u) => u.id !== client.user.id && ( r.emoji.name === "🌱" || r.emoji.id === "756114492055617558" ), time: 180000});
    collector.on("collect", async (r, memb) => {
      let react = r.emoji.id || r.emoji.name;
      let user = memb.data;

      if (react === "🌱"){

        if ( level === 20 ){
          msg.msg({title: "Ещё больше?", description: `Не нужно, дерево уже максимального уровня!`, author: {name: memb.username, iconURL: memb.avatarURL()}, delete: 7000});
          message.reactions.resolve("🌱").remove();
          return;
        }


        if (!user.seed){
          msg.msg({title: "У вас нет Семян", description: `Где их достать? Выполняйте ежедневные квесты, каждый 50-й выполненый квест будет вознаграждать вас двумя семечками.`, author: {name: memb.username, iconURL: memb.avatarURL()}, delete: 7000});
          return;
        }


        server.treeSeedEntry = (server.treeSeedEntry ?? 0) + 1;
        user.seed--;
        msg.msg({title: `Спасибо за семечко, ${memb.username}`, description: `🌱 `, delete: 7000});

        // Если уровень дерева увеличился
        if (server.treeSeedEntry >= costsUp){
          server.treeSeedEntry = 0;
          level = server.treeLevel = (server.treeLevel ?? 0) + 1;
          costsUp = COSTS_TABLE[level];
          server.berrys = Math.round(1.5 ** (level + 3) + server.berrys);
          server.berrys = (server.berrys ?? 0) + getSpeedGrowth(level) * 5;

          await message.react("756114492055617558");
          embed.thumbnail = thumbnailArray[ Math.ceil(level / 4) ];

          msg.msg({title: "Дерево немного подросло", description: `После очередного семечка 🌱, дерево стало больше и достигло уровня ${ level }!`});
          delete server.treeMisstakes;
        }


      }


      // Berry take
      if (react === "756114492055617558"){
        if (user.CD_54 > Date.now()){
          msg.msg({title: "Перезарядка...", description: `Вы сможете собрать клубнику только через **${Util.timestampToDate( user.CD_54 - Date.now() )}**`, footer: {text: "Перезарядка уменьшается по мере роста дерева"}, author: {name: memb.username, iconURL: memb.avatarURL()}, delete: 7000, color: "#ff0000"});
          return;
        }

        if (server.berrys < 1){
          msg.msg({title: "Упс..!", description: "На дереве закончилась клубника. Возможно, кто-то успел забрать клубнику раньше вас.. Ждите, пока дозреет следущая, не упустите её!", author: {name: memb.username, iconURL: memb.avatarURL()}, delete: 7000, color: "#ff0000"});
          return;
        }

        const isBerryMany = server.berrys > getSpeedGrowth(level) * 3;

        const farmerBonus = user.voidTreeFarm ?? 0;
        let berrys = isBerryMany ?
          Util.random(1 + farmerBonus, 3 + farmerBonus * 2, {round: false}) :
          1 + farmerBonus;

        berrys = Math.min(Math.floor(berrys), Math.floor(server.berrys));


        user.berrys += berrys;
        server.berrys -= berrys;

        DataManager.data.bot.berrysPrise += berrys * 0.2;
        msg.msg({
          title: "Вы успешно собрали клубнику",
          author: {name: memb.username, iconURL: memb.avatarURL()},
          description: `${ berrys > 5 ? berrys : ["Ноль", "Одна", "Две", "Три", "Четыре", "Пять"][berrys] } ${ Util.ending(berrys, "ягод", "", "а", "ы", {unite: (_quantity, word) => word}) } ${Util.ending(berrys, "попа", "дают", "ла", "ли", {unite: (_quantity, word) => word})} в ваш карман <:berry:756114492055617558>`,
          delete: 9000
        });
        user.CD_54 = Date.now() + Math.max( 86400000 / getSpeedGrowth(level) * (1 + level), 7200000 );

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
        let berrysTaken = { name: "Клубники собрали участники", value: `${Util.ending(  berrysStarts - Math.floor(server.berrys), "штук", "", "а", "и"  )};` };
        fields.splice(-1, 0, berrysTaken);
      }

      embed.edit = true;
      await message.msg(embed);
    });

    collector.on("end", message.reactions.removeAll);
  }


	options = {
	  "name": "seed",
	  "id": 54,
	  "media": {
	    "description": "\n\nКлубничное дерево? М-м, вкусно, а говорят они на деревьях не ростут..\nОно общее и распространяется по серверу. Будет приносить ягоды, которые может собрать каждый\n_Будьте осторожны, растение может засохнуть, если на сервере недостаточно \"актива\"_\n\n:pencil2:\n```python\n!tree #без аргументов\n```\n\n"
	  },
	  "allias": "tree livetree семечко berrystree дерево клубничноедерево живоедерево"
	};
};

export default Command;