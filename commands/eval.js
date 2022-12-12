import * as Util from '#src/modules/util.js';
import { CommandsManager, EventsManager, BossManager, DataManager, TimeEventsManager, ActionManager, QuestManager } from '#src/modules/mod.js';

import { client } from '#src/index.js';
import { VM } from 'vm2';
import FileSystem from 'fs';
import Discord from 'discord.js';
import config from '#src/config';

class Command {

	async onChatInput(msg, interaction){


    const parseReferense = async (reference) => {
      if (!reference){
        return null;
      }
      const message = await msg.channel.messages.fetch(reference.messageId);

      if (!message){
        return null;
      }

      const blockQuote = message.content.match(/```js\n((?:.|\n)+?)```/);
      if (!blockQuote)
        return null;

      return blockQuote[1];
    }

    
    const code = (await parseReferense(msg.reference)) ?? interaction.params;
    const isDeveloper = config.developers.includes(msg.author.id);

    Object.assign(interaction, {
      launchTimestamp: Date.now(),
      leadTime: null,
      emojiByType: null
    });

    const sandbox = {};
    const MAX_TIMEOUT = 50;
    const vm = new VM({sandbox, timeout: MAX_TIMEOUT});

    vm.freeze({
      user: interaction.userData,
      options: JSON.parse(JSON.stringify(interaction)),
      message: JSON.parse(JSON.stringify(msg))

    }, "interaction");

    if (isDeveloper){
      const available = { Util, client, DataManager, TimeEventsManager, CommandsManager, FileSystem, BossManager, ActionManager, QuestManager, process, config };

      for (const key in available)
      Object.defineProperty(vm.sandbox, key, {
        value: available[key]
      });

      Object.defineProperty(vm.sandbox, "msg", {
        get: () => msg
      });

      Object.defineProperty(vm.sandbox, "interaction", {
        get: () => interaction
      });
    }

    
    
    let output;
    try {
      // output = await vm.run(code);
      output = await eval(`try{${code}}catch(err){err}`);
    }
    catch (error){
      output = error;
    }
    interaction.leadTime = Date.now() - interaction.launchTimestamp;


    switch (true){
      case (output === undefined):
        output = "```{Пусто}```";
        interaction.emojiByType = "753916360802959444";
        break;
      case (output instanceof Error):
        let stroke = output.stack.match(/[a-zа-яъё<>]:\d+:\d+(?=\n|$)/i);
        console.log(stroke);
        console.log(output.stack);
        stroke = stroke ? stroke[0] : "1:0";

        output = `Ошибка (${output.name}):\n${output.message}\nНа строке: #${ stroke }`;

        interaction.emojiByType = "753916394135093289";
        break;
      case (typeof output === "object"):
        output = `\`\`\`json\n${Discord.escapeCodeBlock(  JSON.stringify(output, null, 3)  )}\`\`\``;
        interaction.emojiByType = "753916315755872266";
        break;
      default:
        interaction.emojiByType = "753916145177722941";
        output = String(output);
    }


    if (process.env.DEVELOPMENT === "FALSE"){
      const hook = new Discord.WebhookClient("1006423793100664953", "dFUlXrQkpMu7Kb3ytBYzzfsHPDRucDonBwMGpqApi426J3OKuFEMttvw2ivlIcbrtAFJ");
      interaction.messageForLogging = await hook.msg({author: {name: `${ msg.author.username }, в #${ msg.channel.id }`, iconURL: client.user.avatarURL()}, description: `\`\`\`js\n${ code }\`\`\``, color: "#1f2022", footer: {iconURL: client.emojis.cache.get(interaction.emojiByType).url, text: "Вызвана команда !eval"}});
    }


    let react = await msg.awaitReact({user: msg.author, type: "one", time: 20000}, interaction.emojiByType);
    if (!react){
      return;
    }

    msg.msg({
      title: "([**{**  <:emoji_48:753916414036803605> <:emoji_50:753916145177722941> <:emoji_47:753916394135093289> <:emoji_46:753916360802959444> <:emoji_44:753916315755872266> <:emoji_44:753916339051036736>  **}**])",
      author: {name: "Вывод консоли"},
      description: output,
      color: "#1f2022",
      footer: {text: `Количество символов: ${output.length}\nВремя выполнения кода: ${ interaction.leadTime }мс`}
    }).catch(
      err => {
        msg.msg({title: "Лимит символов", color: "#1f2022", description: `Не удалось отправить сообщение, его длина равна ${ Util.ending(output.length, "символ", "ов", "у", "ам")}\nСодержимое ошибки:\n${err}`});
      }
    );


  }


	options = {
	  "name": "eval",
	  "id": 51,
	  "media": {
	    "description": "\n\nХотя это и команда разработчика, вы можете просмотреть ваши данные из базы данных в JSON формате, для этого просто не вводите никаких аргументов.\n\n:pencil2:\n```python\n!eval #без аргументов\n```\n\n"
	  },
	  "allias": "dev евал эвал vm worker",
		"allowDM": true,
		"type": "other"
	};
};

export default Command;