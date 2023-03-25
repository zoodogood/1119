import * as Util from '#lib/util.js';
import { client } from '#bot/client.js';
import { Actions } from '#lib/modules/ActionManager.js';

class Command {

	async onChatInput(msg, interaction){
    const memb = interaction.mention;
    let chilli = msg.channel.chilli && msg.channel.chilli.find(chilli => chilli.current === msg.author.id);
    setTimeout(() => msg.delete(), 30_000);

    const guildMembers = interaction.guild.members;
    const addName = (member) => {
      const newName = member.displayName + "(🌶)";
      member.setNickname(newName).catch(() => {});
    }
    const removeName = (member) => {
      const newName = member.displayName.replace(/\(🌶\)/g, "").trim();
      member.setNickname(newName).catch(() => {});
    }


    if (!chilli && !msg.author.data.chilli) {
      return msg.msg({title: "Для броска у вас должен быть чилли 🌶️\nКупить его можно в !лавке", color: "#ff0000", delete: 5000, footer: {iconURL: "https://emojitool.ru/img/microsoft/windows-10-may-2019-update/hot-pepper-2179.png", text: "Безудержный перчик™"}});
    }
    if (msg.channel.chilli && msg.channel.chilli.find(e => e.id == memb.id)) {
      return msg.msg({title: "Вы не можете бросить перец в участника с перцем в руке", color: "#ff0000", footer: {iconURL: "https://emojitool.ru/img/microsoft/windows-10-may-2019-update/hot-pepper-2179.png", text: "Перчик™"}});
    }
    if (memb.bot) {
      return msg.msg({title: "🤬🤬🤬", description: "it's hot fruitctttt", color: "#ff0000", footer: {iconURL: "https://emojitool.ru/img/microsoft/windows-10-may-2019-update/hot-pepper-2179.png", text: "Кое-кто бросил перец в бота.."}});
    }

    if (chilli){
      chilli.current = memb.id;
      chilli.players[msg.author.id] = ++chilli.players[msg.author.id] || 1;
      removeName(guildMembers.resolve(interaction.mention));
      addName(guildMembers.resolve(memb));

      msg.msg({title: ["Бросок!", "А говорят перцы не летают..."].random(), 
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

    const confirm = await msg.msg({title: "Подготовка", description: `${ msg.author.username }, вы бросили перец, нажмите "❌" чтобы отменить`, reactions: ["❌"]});

    await Util.sleep(2000);
    confirm.delete();

    const confirmed = !confirm.reactions.cache.get("❌").users.cache.has(msg.author.id);
    if (!confirmed){
      msg.msg({title: "Отменено 🌶️", delete: 7000});
      return;
    }
      


    msg.author.data.chilli--;
    msg.channel.chilli = msg.channel.chilli || [];

    msg.msg({title: `Перец падает! Перец падает!!`, description: `\*перец упал в руки ${memb.toString()}\*\nЧтобы кинуть обратно используйте \`!chilli @memb\``, author: {name: msg.author.username, iconURL: msg.author.avatarURL()}, footer: {iconURL: "https://emojitool.ru/img/microsoft/windows-10-may-2019-update/hot-pepper-2179.png", text: "Безудержный перчик™"}});
    addName(guildMembers.resolve(memb));
    let ms = Util.random(30, 37) * 1000;

    chilli = { timestamp: Date.now() + ms, players: {}, current: memb.id, rebounds: 0, author: msg.author.id };
    chilli.players[ memb.id ] = 0;
    chilli.players[ msg.author.id ] = 0;

    msg.channel.chilli.push(chilli);

    chilli.timeout = setTimeout(() => {
      const member = guildMembers.cache.get(chilli.current);

      Object.keys(chilli.players)
        .forEach(id => client.users.cache.get(id).action(Actions.chilliBooh, {boohTarget: member, chilli, msg, interaction}));

      msg.msg({title: "Бах! Перчик взорвался!", 
        description: `Перец бахнул прямо у ${ member }\nИгра окончена.\nБыло совершено отскоков: ${ chilli.rebounds }`,
        fields: Object.entries(chilli.players).sortBy("1", true).map(([id, score]) => ({name: guildMembers.cache.get(id).user.username, value: `Счёт: ${ score }`})).slice(0, 20),
        footer: {iconURL: "https://emojitool.ru/img/microsoft/windows-10-may-2019-update/hot-pepper-2179.png", text: "Безудержный перчик™"}
      });
      removeName(member);
      msg.channel.chilli.splice(msg.channel.chilli.indexOf(chilli), 1);


      if (!msg.channel.chilli[0]) {
        delete msg.channel.chilli;
      }
    }, ms);

  }


	options = {
	  "name": "chilli",
	  "id": 38,
	  "media": {
	    "description": "\n\nМини-игра \"Жгучий перчик\" подразумивает перебрасывание вымешленного перца, который через некоторое время бабахнет в руках у одного из участников — в этом случае игрок проигрывает.\nСтратегия здесь приветсвуется, а сама игра отлично подходит для проведения турниров.\n\n:pencil2:\n```python\n!chilli {memb}\n```\n\n"
	  },
	  "allias": "перчик перец",
		"expectMention": true,
		"allowDM": true,
		"hidden": true,
		"cooldown": 3500000,
		"type": "other"
	};
};

export default Command;