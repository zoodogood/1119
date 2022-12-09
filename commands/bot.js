import * as Util from '#src/modules/util.js';
import { client } from '#src/index.js';
import DataManager from '#src/modules/DataManager.js';

class Command {

	async onChatInput(msg, interaction){


    let {rss, heapTotal} = process.memoryUsage();
    let season = ["Зима", "Весна", "Лето", "Осень"][Math.floor((new Date().getMonth() + 1) / 3) % 4];
    const VERSION = "V6.0 BETA";

    const embed = {
      title: "ну типа.. ай, да, я живой, да",
      description: `<:online:637544335037956096> Пинг: ${client.ws.ping} ${VERSION} [#${season}](https://hytale.com/supersecretpage), что сюда ещё запихнуть?\nСерваков...**${client.guilds.cache.size}** (?) Команд: ${Command.cmds}\nСимволов в скрипте: примерно **#**Почему-то это никому не понравилось и было удалено;\n\`${(heapTotal/1024/1024).toFixed(2)} мб / ${(rss/1024/1024).toFixed(2)} МБ\``,
      footer: {text: `Укушу! Прошло времени с момента добавления бота на новый сервер: ${ Util.timestampToDate(Date.now() - DataManager.data.bot.newGuildTimestamp, 2) }`},
      components: [
        {
          type: 2,
          label: "Удалить!",
          style: 1,
          customId: "bot_hi"
        },
        {
          type: 2,
          label: "Сервер",
          style: 5,
          url: "https://discord.gg/76hCg2h7r8",
          emoji: {name: "grempen", id: "753287402101014649"}
        },
        {
          type: 2,
          label: "Пригласить",
          style: 5,
          url: `https://discord.com/api/oauth2/authorize?client_id=${ client.user.id }&permissions=1073741832&scope=applications.commands%20bot`,
          emoji: {name: "berry", id: "756114492055617558"}
        }
      ]
    };

    msg.msg(embed);
  }


	options = {
	  "name": "bot",
	  "id": 15,
	  "media": {
	    "description": "\n\nПоказывает интересную информацию о боте. Именно здесь находится ссылка для приглашения его на сервер.\n\n:pencil2:\n```python\n!bot #без аргументов\n```\n\n"
	  },
	  "allias": "бот stats статс ping пинг стата invite пригласить",
		"allowDM": true,
		"cooldown": 10000000,
		"type": "bot"
	};
};

export default Command;