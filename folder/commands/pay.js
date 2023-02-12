import * as Util from '#lib/modules/util.js';
import Discord from 'discord.js';

class Command {

	async onChatInput(msg, interaction){
    let memb = interaction.mention;
    interaction.params = interaction.params.replace(new RegExp(`<@!?${memb.id}>`), "");


    let num = interaction.params.match(/\d+|\+/);

    if (!num) {
      msg.msg({title: "Вы не ввели значение. Ожидается сумма передачи.", color: "#ff0000"});
      return;
    }

    num = num[0];
    interaction.params = interaction.params.replace(num, "").trim();

    let [itemName, ...message] = interaction.params.split(" ");


    if (memb.bot) {
      msg.msg({title: "Вы не можете передать что-либо боту"});
      return;
    }

    let heAccpet = await Util.awaitUserAccept({name: "give", message: {title: "Используя эту команду вы потеряете коины или другие ресурсы"}, channel: msg.channel, userData: interaction.userData});
    if (!heAccpet) return;

    if (memb === msg.author) {
      msg.msg({title: `${msg.author.username} попытался наколдовать немного ресурсов (${ num } ❔) — безуспешно.`});
      return;
    }


    const RESOURCES = [
      {
        resource: "coins",
        names: "coins coin коин коинов коина коины монет монету монеты монета",
        gives: n => `${ Util.ending(n, "коин", "ов", "", "а")} <:coin:637533074879414272>`
      },

      {
        resource: "void",
        names: "void камень камня камней нестабильность камни нестабильности нест н",
        gives: n => `${ Util.ending(n, "кам", "ней", "ень", "ня")} нестабильности`
      },

      {
        resource: "chestBonus",
        names: "bonus chest бонус бонусов бонуса бонусы сундук сундука сундуки сундуков б с",
        gives: n => `${  Util.ending(n, "бонус", "ов", "", "а") } сундука`
      },

      {
        resource: "chilli",
        names: "chilli перец перца перцев перцы",
        gives: n =>  Util.ending(n, "пер", "цев", "ец", "ца")
      },

      {
        resource: "keys",
        names: "keys key ключ ключей ключа ключи k к",
        gives: n =>  Util.ending(n, "ключ", "ей", "", "а")
      },

      {
        resource: "berrys",
        names: "клубника клубник клубники berrys berry ягод ягода ягоды",
        gives: n =>  Util.ending(n, "клубник", "", "а", "и")
      },

      {
        resource: "monster",
        names: "monster монстр монстра монстров монстры",
        gives: n =>  Util.ending(n, "монстр", "ов", "", "а")
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
      num = interaction.userData[ resource ];
    }
    num = Math.floor(num);

    if (num < 0){
      msg.msg({title: "Введено отрицательное значение.\n<:grempen:753287402101014649> — Укушу."});
      return;
    }

    if (isNaN(interaction.userData[resource])){
      interaction.userData[resource] = 0;
    }

    if (isNaN(memb.data[resource])){
      memb.data[resource] = 0;
    }


    if (interaction.userData[ resource ] < num) {
      const description = Discord.escapeMarkdown(msg.content);
      msg.msg({title: `Нужно ещё ${ resourceData.gives(num - interaction.userData[ resource ]) }`, description, delete: 12000});
      return;
    }






    interaction.userData[ resource ] -= num;
    memb.data[ resource ] += num;

    msg.msg({description: `${msg.author.username} отправил ${ resourceData.gives(num) } для ${ memb.toString() }` + (message ? `\nС сообщением:\n${ message }` : ""), author: {name: "Передача", iconURL: msg.author.avatarURL()}});
  }


	options = {
	  "name": "pay",
	  "id": 14,
	  "media": {
	    "description": "\n\nИспользуйте, чтобы передать коины другому пользователю в качестве доброго подарка или оплаты за помощь :wink:\n\n:pencil2:\n```python\n!pay {memb} {coinsCount | \"+\"} <message> #аргументы можно указывать в любом порядке. \"+\" обозначает \"Все коины, которые у вас есть\"\n```\n\n"
	  },
	  "allias": "give дать заплатить",
		"expectMention": true,
		"allowDM": true,
		"cooldown": 300000000,
		"type": "user"
	};
};

export default Command;