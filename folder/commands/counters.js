

import * as Util from '#lib/util.js';
import Discord from 'discord.js';
import CounterManager from '#lib/modules/CounterManager.js';

class Command {

  fetchCountersInGuild(guild){
    return CounterManager.data
      .filter(counter => counter.guildId === guild.id);
  }

  createEmbed({interaction, counters}){
    const toValue = (counter) => ({
      message: `🖊️ [Сообщение.](https://discord.com/channels/${ counter.guildId }/${ counter.channelId }/${ counter.messageId })`,
      channel: `🪧 \`#${ interaction.guild.channels.cache.get(counter.channelId).name }\``,
      poster: `🖌️ <#${ counter.channelId }>`
    })[counter.type];

    const toField = (counter, i) => ({name: `**${i + 1}.**`, value: toValue(counter), inline: true}); 

    const fields = 
      counters.map(toField);

    !fields.length && fields.push({name: "Но здесь пусто.", value: "Чтобы добавить счётчики, используйте `!counter`"});

    return {
      title: "Счётчики сервера",
      fields
    };
  }

	async onChatInput(msg, interaction){
    

    const counters = this.fetchCountersInGuild(interaction.guild);
    const embed = this.createEmbed({interaction, counters});
    

    const message = await msg.msg(embed);

    const reactions = () => (counters.length && !interaction.user.wastedPermissions(16)[0]) ? ["✏️", "🗑️"] : ["❌"];
    let react, question, answer, counter;
    while (true){
      react = await message.awaitReact({user: msg.author, removeType: "all"}, ...reactions());
      switch (react) {
        case "🗑️":
          question = await msg.msg({title: "Введите номер счётчика, для его удаления"});
          answer = await Util.awaitReactOrMessage(question, msg.author, "❌");
          question.delete();
          if (!answer || !answer.content || isNaN(answer.content) || answer.content > counters.length) break;
          counter = counters.splice(answer.content - 1, 1)[0];
          CounterManager.delete(counter._original);
          counters.forEach((e, i) => e.name = `**${i + 1}.**`);
          message.msg({title: "Счётчики сервера", edit: true, fields: counters[0] ? counters : {name: "Тут пусто.", value: "Вы удалили последний счётчик"}, description: `Счётчик #${answer.content} успешно удалён.`});
        break;
        case "✏️":
          question = await msg.msg({title: "Введите номер счётчика, для его редактирования"});
          answer = await Util.awaitReactOrMessage(question, msg.author, "❌");

          if (!answer || !answer.content || isNaN(answer.content) || answer.content - 1 > counters.length){
            question.delete();
            msg.msg({title: "Элемента с таким номером не существует", color: "#ff0000"});
            break;
          };

          counter = counters[answer.content - 1];
          question.msg({title: "Введите новое содержание", edit: true, description: `**Старое:**\n\`\`\`${Discord.escapeCodeBlock( counter._original.template )}\`\`\``});
          answer = await msg.channel.awaitMessage(msg.author);
          question.delete();
          counter._original.template = answer.content;
          CounterManager.file.write();
          CounterManager.up(counter._original);

          counter.value = counter.type == "channel" ? `🪧 \`#${msg.guild.channels.cache.get(e.channel).name}\`` : counter.value ;
          message.msg({title: "Счётчики сервера", edit: true, fields: counters, description: `Сообщение счётчика успешно отредактированно!`});
        break;
        default: return message.delete();
      }
    }
  }


	options = {
	  "name": "counters",
	  "id": 43,
	  "media": {
	    "description": "\n\nОтображает список существующих счётчиков на сервере. См. команду `!counter`\n\n:pencil2:\n```python\n!counters #без аргументов\n```\n\n"
	  },
	  "allias": "счётчики счетчики",
		"allowDM": false,
		"cooldown": 10_000_000,
		"type": "guild"
	};
};

export default Command;