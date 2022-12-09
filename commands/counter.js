import * as Util from '#src/modules/util.js';
import CounterManager from '#src/modules/CounterManager.js';

class Command {

	async onChatInput(msg, interaction){
    msg.msg({content: "123"});
    if (CounterManager.data.filter(counter => counter.guildId === msg.guild.id).length >= 15){
      msg.msg({title: "Максимум 15 счётчиков", color: "#ff0000", delete: 7000});
    }

    const context = {
      interaction,
      questionMessage: null,
      typeBase: null,
      templateContent: null,
      counter: {}
    }
    const counterTypes = [
      {
        emoji: "🖊️",
        label: "🖊️Сообщение",
        description: "Единожды отправляет сообщение и после, ненавязчиво, изменяет его содержимое",
        id: "message",
        change: async (context) => {
          const counter = context.counter;
          counter.channelId = interaction.channel.id;
          counter.guildId   = interaction.guild.id;
          counter.authorId  = interaction.user.id;

          context.questionMessage = await msg.msg({title: "Вашему сообщению нужен эмбед?", description: `Подразумивается эмбед-обёртка: цвет и заглавие`});
          const react = await message.awaitReact({user: msg.author, type: "all"}, "685057435161198594", "763807890573885456");
          context.questionMessage.delete();

          if (!react){
            return;
          }

          if (react === "685057435161198594"){

          }

          if (react === "763807890573885456"){

          }
        }
      },
      {
        emoji: "🪧",
        label: "🪧Имя канала",
        description: "Меняет имя указаного канала",
        id: "channel",
        change: async (context) => {
          const counter = context.counter;
          counter.channelId = interaction.channel.id;
          counter.guildId   = interaction.guild.id;
          counter.authorId  = interaction.user.id;
          
        }
      },
      {
        emoji: "🖌️",
        label: "🖌️Отправка сообщения",
        description: "Отправляет в указаный канал",
        id: "poster",
        change: async (context) => {
          const counter = context.counter;
          counter.channelId = interaction.channel.id;
          counter.guildId   = interaction.guild.id;
          counter.authorId  = interaction.user.id;
          
        }
      }
    ];


    context.questionMessage = await msg.msg({title: "🪄 Выберите тип объекта для счётчика", description: `Счётчики работают с каналами и сообщениями\nвыберите тип ${ counterTypes.map(({label, description}) => `❯ ${ label }\n> ${ description }\n> `).join("\n") }\n `});
    const takeCounterType = async (context) => {
      const reactions = counterTypes.map(({emoji}) => emoji);
      const reaction = await context.questionMessage.awaitReact({user: msg.author, type: "all"}, ...reactions);
      return counterTypes.find(({emoji}) => emoji === reaction);
    }
    context.typeBase = await takeCounterType(context);
    
    if (!context.type){
      context.questionMessage.delete();
      return;
    }
    context.questionMessage.msg({title: "🪄 Отлично! Введите текст с использованием шаблонов", description: "Каждые 15 минут счётчик будет изменять своё значение на основе актуальных данных шаблона", edit: true});
    context.templateContent = await msg.channel.awaitMessage(msg.author)?.content;

    context.questionMessage.delete();
    if (!context.templateContent){
      return;
    }

    if (!context.templateContent.match(/\{(?:.|\n)+?\}/)){
      msg.msg({title: "В сообщении отсуствуют шаблоны.", color: "#ff0000", delete: 5000});
      return;
    }

    const counter = await context.typeBase.change(context.context);
    if (!counter){
      return;
    }
    CounterManager.create(counter);
    msg.msg({title: "Успех", delete: 4_000});

    switch (type) {
      case "🖊️":
        let embed = {embed: true};
        let textValue = template;
        let message = await msg.msg({title: "Вашему сообщению нужен эмбед?", description: `Подразумивается эмбед-обёртка, цвет и заглавие`});
        react = await message.awaitReact({user: msg.author, type: "all"}, "685057435161198594", "763807890573885456");
        message.delete();
        if (react == 685057435161198594){
          embed = {description: template}
          answer = await msg.channel.awaitMessage(msg.author, {title: "Укажите оглавление эмбеда", embed: {description: `Оглавление — голова эмбед сообщения...\nОна поддерживает шаблоны`, time: 1_200_000}});
          if (!answer) return false;
          textValue = answer.content || "";

          answer = await msg.channel.awaitMessage(msg.author, {title: "Введите цвет в HEX формате", embed: {description: `HEX — #ff0000, где первые два числа в 16-значной системе (0,1,2,...,e,f) — красный, за ним зеленый и синий`, time: 1_200_000}});
          if (!answer) return false;
          embed.color = answer.content.replace("#", "");
        }

        msg.msg({title: "Через секунду здесь появится сообщение", description: "Это и будет готовый счётчик", delete: 7000});
        await Util.sleep(1500);
        counter = await msg.msg({title: textValue, ...embed});
        
      break;
      case "🪧":
        let channel = await msg.channel.awaitMessage(msg.author, {title: "Введите айди канала или упомяните его"});
        if (channel){
          channel = (channel.mentions.channels.first()) ? channel.mentions.channels.first() : msg.guild.channels.cache.get(channel.content);
          msg.msg({title: "Готово, название этого канала отображает введенную инфомацию.", description: "Чтобы удалить счётчик, воспользуйтесь командой `!counters`", delete: 7000});
          CounterManager.create({channelId: channel.id, guildId: msg.guild.id, type: "channel", template});
        }
        else msg.channel.msg({title: "Канал не существует", color: "#ff0000"});
      break;
      case "🖌️":
        let interval = await msg.channel.awaitMessage(msg.author, {title: "Укажите кол-во минут между отправкой сообщения", description: "Минимум 15м"});
        interval = interval && +interval.content > 15 && +interval.content;
        if (!interval) return msg.msg({title: "Неверное значение", color: "#ff0000", delete: 4000});
        CounterManager.create({channelId: msg.channel.id, guildId: msg.guild.id, type: "poster", template, params: interval});
      break;
      default: return await Util.sleep(2000);

    }
  }


	options = {
	  "name": "counter",
	  "id": 42,
	  "media": {
	    "description": "\n\nОтличный способ отображать статистику — с помощью шаблонов создайте динамический текст, который будет меняться каждые 15 минут. Счётчики могут менять как имя любого канала, так и содержание сообщения.\n\n:pencil2:\n```python\n!counter #без аргументов\n```\n\n"
	  },
	  "allias": "счётчик счетчик count",
		"allowDM": true,
		"type": "guild",
		"Permissions": 16
	};
};

export default Command;