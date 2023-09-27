import * as Util from '#lib/util.js';
import { client } from '#bot/client.js';

class Command {

	async onChatInput(msg, interaction){
    let memb = interaction.mention || client.users.cache.get(interaction.params) || msg.author;

    let first = true;
    if ("iq" in memb.data) {
      first = false;
    }

    let iq = memb.data.iq = first ? Util.random(30, 140) : Math.max(memb.data.iq, 0);
    let name = (memb === msg.author) ? "вас" : "него";

    let description;
    if (Util.random(18)){
      description = `У ${name}${(!first) ? " всё так же" : ""} ${iq} ${ (interaction.message.content.match(/[a-zа-яїъё]+/i)?.[0] ?? "IQ") .toUpperCase() }`;
    } else {
      iq = ++memb.data.iq;
      description = `Удивительно у ${name} айкью вырос на одну единицу! Сейчас ${interaction.command.toUpperCase()} === ${iq}`;
    }
    msg.msg({title: "<a:iq:768047041053196319> + <a:iq:768047041053196319> = ICQ²", description, author: {iconURL: memb.avatarURL(), name: memb.username}});
  }


	options = {
	  "name": "iq",
	  "id": 31,
	  "media": {
	    "description": "\n\nХотя мы не знаем ваш настоящий IQ, можем предложить наш собственный..\nВозможно, когда-то у нас появится тест на ICQ\n\n✏️\n```python\n!iq <memb>\n```\n\n"
	  },
	  "allias": "iqmeme icq айкю айкью iqbanana",
		"allowDM": true,
		"cooldown": 15_000,
		"type": "user"
	};
};

export default Command;