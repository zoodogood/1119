import * as Util from '#lib/util.js';
import CounterManager from '#lib/modules/CounterManager.js';
import { ButtonStyle, ComponentType, escapeMarkdown } from 'discord.js';
import { CommandsManager } from '#lib/modules/mod.js';

class Command {

	async onChatInput(msg, interaction){
 
    if (CounterManager.data.filter(counter => counter.guildId === interaction.guild.id).length >= 15){
      interaction.channel.msg({title: "Максимум 15 счётчиков", color: "#ff0000", delete: 12_000});
      return;
    }

    const context = {
      interaction,
      questionMessage: null,
      typeBase: null,
      template: null,
      counter: {}
    }
    
    const counterTypes = [...CounterManager.countersTypes.values()];

    context.questionMessage = await msg.msg({
      title: "🪄 Выберите тип объекта для счётчика",
      description: `Счётчики работают с каналами и сообщениями.\nВыберите основу для дальнельшей настройки.\n\n${ counterTypes.map(({label, description}) => `❯ ${ label.toUpperCase() }\n> ${ description }.\n> ​`).join("\n") }`
    });
    const takeCounterType = async (context) => {
      const reactions = counterTypes.map(({emoji}) => emoji);
      const reaction = await context.questionMessage.awaitReact({user: msg.author, removeType: "all"}, ...reactions);
      return counterTypes.find(({emoji}) => emoji === reaction);
    }
    context.typeBase = await takeCounterType(context);
    
    if (!context.typeBase){
      context.questionMessage.delete();
      return;
    }
    context.questionMessage.msg({title: "🪄 Отлично! Введите текст с использованием шаблонов", description: "Каждые 15 минут счётчик будет изменять своё значение на основе актуальных данных шаблона", edit: true});
    context.template = (await interaction.channel.awaitMessage({user: msg.author}))?.content;

    context.questionMessage.delete();
    if (!context.template){
      return;
    }

    if (!context.template.match(/\{(?:.|\n)+?\}/)){
      interaction.message.msg({title: "В сообщении отсуствуют шаблоны.", color: "#ff0000", delete: 5000});
      return;
    }

    const counter = await context.typeBase.change(context);
    if (!counter){
      return;
    }
    const { result } = await CounterManager.create(counter);
    await this.displayCreateOutput({interaction, result});
  }

  async displayCreateOutput({interaction, result, counter}){
    const embed = {
      title: "Счётчик создан",
      description: `**Результат:** ${ result instanceof Error ? "исключение" : "успех" }.\n${ escapeMarkdown( String(result).slice(0, 1000) ) }`,
      components: [
        {
          type: ComponentType.Button,
          customId: "open-list",
          label: "Показать список счётчиков сервера",
          style: ButtonStyle.Secondary
        },
        {
          type: ComponentType.Button,
          customId: "delete-counter",
          label: "Удалить этот счётчик",
          style: ButtonStyle.Secondary
        }
      ]
    };
    const message = await interaction.message.msg(embed);

    const filter = ({user}) => interaction.user === user;
    const collector = message.createMessageComponentCollector({max: 1, filter, time: 100_000});

    const countersCommand = CommandsManager.callMap.get("counters");
    collector.on("collect", async interaction => {
      const customId = interaction.customId;
      customId === "delete-counter" && CounterManager.delete(counter);
      customId === "open-list" && countersCommand.onChatInput(interaction.message, interaction);
    });
    collector.on("end", () => message.msg({edit: true, components: []}));

    return;
  }


	options = {
	  "name": "counter",
	  "id": 42,
	  "media": {
	    "description": "\n\nОтличный способ отображать статистику — с помощью шаблонов создайте динамический текст, который будет меняться каждые 15 минут. Счётчики могут менять как имя любого канала, так и содержание сообщения.\n\n✏️\n```python\n!counter #без аргументов\n```\n\n"
	  },
	  "alias": "счётчик счетчик count рахівник",
		"allowDM": true,
		"type": "guild",
		"Permissions": 16
	};
};

export default Command;