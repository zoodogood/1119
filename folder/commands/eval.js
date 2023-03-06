import * as Util from '#lib/util.js';

import { client } from '#bot/client.js';
import Template from '#lib/modules/Template.js';
import config from '#config';

import { escapeCodeBlock, WebhookClient } from 'discord.js';

class Command {

	async onChatInput(msg, interaction){


    const fetchReferense = async (reference) => {
      if (!reference){
        return null;
      }
      const message = await msg.channel.messages.fetch(reference.messageId);

      if (!message){
        return null;
      }

      return message.content;
    }

    

    

    const codeContent = (await fetchReferense(msg.reference)) ?? interaction.params;

    
    Object.assign(interaction, {
      launchTimestamp: Date.now(),
      leadTime: null,
      emojiByType: null,
      description: null,
      codeContent: codeContent.startsWith("```js") ?
        codeContent.match(/```js\n((?:.|\n)+?)```$/)[1] :
        codeContent
    });

    
    const getOutput = async (interaction) => {
      try {
        const source = {executer: interaction.user, type: Template.sourceTypes.call};
        return await new Template(source, interaction).createVM().run(interaction.codeContent);
      }
      catch (error){
        return error;
      }
    }
    const output = await getOutput(interaction);
    interaction.leadTime = Date.now() - interaction.launchTimestamp;


    switch (true){
      case (output === undefined):
        interaction.description = "```{Пусто}```";
        interaction.emojiByType = "753916360802959444";
        break;
      case (output instanceof Error):
        interaction.description = `Ошибка (${ output.name }):\n${ output.message }`;
        interaction.emojiByType = "753916394135093289";
        break;
      case (typeof output === "object"):
        interaction.description = `\`\`\`json\n${ escapeCodeBlock(  JSON.stringify(output, null, 3)  ) }\`\`\``;
        interaction.emojiByType = "753916315755872266";
        break;
      default:
        interaction.description = String(output);
        interaction.emojiByType = "753916145177722941";
    }


    this.loggerProtocol({interaction});


    let react = await msg.awaitReact({user: msg.author, removeType: "one", time: 20000}, interaction.emojiByType);
    if (!react){
      return;
    }

    msg.msg({
      title: "([**{**  <:emoji_48:753916414036803605> <:emoji_50:753916145177722941> <:emoji_47:753916394135093289> <:emoji_46:753916360802959444> <:emoji_44:753916315755872266> <:emoji_44:753916339051036736>  **}**])",
      author: {name: "Вывод консоли"},
      description: interaction.description,
      color: "#1f2022",
      footer: {text: `Количество символов: ${ interaction.description.length }\nВремя выполнения кода: ${ interaction.leadTime }мс`}
    }).catch(
      err => {
        const lengthContent = Util.ending(interaction.description.length, "символ", "ов", "у", "ам");
        msg.msg({title: "Лимит символов", color: "#1f2022", description: `Не удалось отправить сообщение, его длина равна ${ lengthContent }\nСодержимое ошибки:\n${ err }`});
      }
    );


  }

  async loggerProtocol({interaction}){

    if (!process.env.EVAL_WEBHOOK_ID_AND_TOKEN){
      return;
    }
    
    const [id, token] = process.env.EVAL_WEBHOOK_ID_AND_TOKEN.split(" ");
    const hook = new WebhookClient({id, token});
    interaction.messageForLogging = await hook.msg({
      author: {
        name: `${ interaction.user.username }, в #${ interaction.channel.id }`,
        iconURL: client.user.avatarURL()
      },
      description: `\`\`\`js\n${ interaction.codeContent }\`\`\``,
      color: "#1f2022",
      footer: {iconURL: client.emojis.cache.get(interaction.emojiByType).url, text: "Вызвана команда !eval"}
    });
    return;
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