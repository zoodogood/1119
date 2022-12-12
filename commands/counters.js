import * as Util from '#src/modules/util.js';
import Discord from 'discord.js';
import CounterManager from '#src/modules/CounterManager.js';

class Command {

	async onChatInput(msg, interaction){
    const counterContent = (counter) => ({
      title: `🖊️ [Сообщение.](https://discord.com/channels/${ counter.guildId }/${ counter.channelId }/${ counter.messageId })`,
      channel: `🪧 \`#${ msg.guild.channels.cache.get(counter.channel).name }\``,
      poster: `🖌️ <#${ counter.channel }>`
    })[counter.type];

    const counters = CounterManager.data
      .filter(counter => counter.guildId === msg.guild.id)
      .map((counter, i) => ({name: `**${i + 1}.**`, value: counterContent(counter), inline: true, counter: counter}));

    let message  = await msg.msg({title: "Счётчики сервера", fields: counters[0] ? counters : {name: "Но тут — пусто.", value: "Чтобы добавить счётчики, используйте `!counter`"}});

    const reactions = () => (counters[0] && !interaction.mention.wastedPermissions(16)[0]) ? ["✏️", "🗑️"] : ["❌"];
    let react, question, answer, counter;
    while (true){
      react = await message.awaitReact({user: msg.author, type: "all"}, ...reactions());
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
          CounterManager.writeFile();
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
		"allowDM": true,
		"cooldown": 10000000,
		"type": "guild"
	};
};

export default Command;