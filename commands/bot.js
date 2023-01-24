import * as Util from '#src/modules/util.js';
import { client } from '#src/index.js';
import config from '#src/config';
import DataManager from '#src/modules/DataManager.js';
import CommandsManager from '#src/modules/CommandsManager.js';
import app from '#src/modules/app.js';

class Command {

  onComponent(target, interaction){
    this.componentsCallbacks[target](interaction);
  }

  componentsCallbacks = {
    removeMessage(interaction){
      interaction.message.delete();
      
      interaction.msg({
        title: "Сообщение удалено",
        description: "Зачем удалено, почему удалено, что было бы если бы вы не удалили это сообщение, имело ли это какой-нибудь скрытый смысл...?",
        author: {
          name: interaction.member.user.username,
          iconURL: interaction.user.avatarURL()
        }
      });
    }
  }

	async onChatInput(msg, interaction){


    const {rss, heapTotal} = process.memoryUsage();
    const { address, port } = app.server?.address() || {};

    const season = ["Зима", "Весна", "Лето", "Осень"][Math.floor((new Date().getMonth() + 1) / 3) % 4];
    const version = config.version;

    const contents = {
      ping: `<:online:637544335037956096> Пинг: ${ client.ws.ping }`,
      version: `V${ version }`,
      season: `[#${season}](https://hytale.com/supersecretpage)`,
      guilds: `Серваков...**${ client.guilds.cache.size }**`,
      commands: `Команд: ${ CommandsManager.collection.size }`,
      time: `Время сервера: ${ new Intl.DateTimeFormat("ru-ru", {hour: "2-digit", minute: "2-digit"}).format() }`,
      address: address ? `; Доступен по адрессу: http://${ address.replace("::", "localhost") }:${ port }` : "",
      performance: `\`${ ( heapTotal/1024/1024 ).toFixed(2) } мб / ${( rss/1024/1024 ).toFixed(2)} МБ\``
    };

    const embed = {
      title: "ну типа.. ай, да, я живой, да",
      description: `${ contents.ping } ${ contents.version } ${ contents.season }, что сюда ещё запихнуть?\n${ contents.guilds }(?) ${ contents.commands }\n${ contents.performance }\n${ contents.time }${ contents.address }`,
      footer: {text: `Укушу! Прошло времени с момента добавления бота на новый сервер: ${ Util.timestampToDate(Date.now() - (DataManager.data.bot.newGuildTimestamp ?? null), 2) }`},
      components: [
        {
          type: 2,
          label: "Удалить!",
          style: 1,
          customId: "@command/bot/removeMessage"
        },
        {
          type: 2,
          label: "Сервер",
          style: 5,
          url: config.guild.url,
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
