import * as Util from '#src/modules/util.js';
import { client } from '#src/index.js';
import Discord from 'discord.js';

class Command {

	async onChatInput(msg, interaction){
    let answer = await Util.awaitUserAccept({name: "embeds", message: {title: "Эта команда находит до 70-ти эмбедов в канале", description: "С её помощью вы можете переставлять местами эмбед сообщения или получить их в JSON формате\nОбратите внимание, всё обычные сообщения будут **удалены**, а эмбеды будут заново отправленны в новом порядке **от имени Призрака**\n\nРеакции:\n • <:json:754777124413505577> - отправляет вам JSON выбранного сообщения\n • <:swap:754780992023167007> - меняет местами два эмбеда\n • <:right:756212089911247021> - применить изменения и завершить команду"}, channel: msg.channel, userData: interaction.userData});
    if (!answer) return;

    let embeds = await msg.channel.messages.fetch({limit: 100, before: (interaction.params || null)});
      embeds.concat(await msg.channel.messages.fetch({limit: 100, before: embeds.last().id}));

    embeds = [...embeds.filter(e => e.embeds.find(e => e.type == "rich" && e.color != 10092543)).values()];
    embeds.length = Math.min(embeds.length, 70);

    if (!embeds[0]) return msg.msg({title: "В канале не найдено эмбед сообщений", delete: 3000});

    let input   = embeds.reverse().map((e, i) => (i + 1) + ". " + e.embeds[0].title).join("\n");
    let bot_msg = await msg.msg({title: "	• " + embeds.length + " <a:diamond:725600667586134138>", description: input, color: "#99ffff"});


    let eventFuncDelete = e => {
      if (e.channel.id != msg.channel.id || !e.embeds.find(e => e.type == "rich" && e.color != 10092543)) return;
      let index = embeds.findIndex(el => el.id == e.id);
      if (!index) return;
      embeds.splice(index, 1);

      input = embeds.map((e, i) => (i + 1) + ". " + e.embeds[0].title).join("\n");
      bot_msg.msg({title: "	• " + embeds.length + " <a:diamond:725600667586134138>", description: input, color: "#99ffff", edit: true});
    }
    client.on("messageDelete", eventFuncDelete);
    setTimeout(e => client.removeListener("messageDelete", eventFuncDelete), 600000);

    let eventFuncWrite = e => {
      if (e.channel.id != msg.channel.id || !e.embeds.find(e => e.type == "rich" && e.color != 10092543)) return;

      embeds.push(e);
      let input = embeds.map((e, i) => (i + 1) + ". " + e.embeds[0].title).join("\n");
      bot_msg.msg({title: "	• " + embeds.length + " <a:diamond:725600667586134138>", description: input, color: "#99ffff", edit: true});
    }
    client.on("message", eventFuncWrite);
    setTimeout(e => client.removeListener("message", eventFuncWrite), 600000);


    let react;
    do {
      react = await bot_msg.awaitReact({user: msg.author, removeType: "one", time: 60000}, "754777124413505577", "754780992023167007", "756212089911247021");
      switch (react) {
        case "754777124413505577":
          answer = await msg.channel.awaitMessage(msg.author, {title: "Введите индекс элемента для получения его в JSON виде", embed: {color: "#99ffff"}});
          if (!answer) return;
          answer = Number(answer.content);
          if (isNaN(answer) || embeds.length < answer || answer < 0) {
            msg.msg({title: "Некорректное значение", description: "Введите число от 1 до " + embeds.length, color: "#ff0000", delete: 3000});
            break;
          }

          let element = embeds[answer - 1];
          msg.author.msg({title: "> " + element.embeds[0].title, description: "```JSON\n" + Discord.escapeCodeBlock( JSON.stringify(element.embeds[0], null, 2) ) + "```"});
          msg.msg({title: "Готово! Лично отправил вам в личные сообщения", color: "#99ffff", delete: 3500});
          break;

        case "754780992023167007":
          answer = await msg.channel.awaitMessage(msg.author, {title: "Чтобы переместить сообщение, введите его позицию и место на которое его нужно переместить", embed: {color: "#99ffff"}});
          let indices = answer.content.match(/\d+/g);
          if (!indices[1]){
            msg.msg({title: "Некорректное значение", description: "Введите 2 числа в диапазоне от 1 до " + embeds.length, color: "#ff0000", delete: 3000});
            break;
          }
          embeds.splice(indices[0] - 1, 1, ...embeds.splice(indices[1] - 1, 1, embeds[indices[0] - 1]));

          let input = embeds.map((e, i) => (i + 1) + ". " + e.embeds[0].title).join("\n");
          await bot_msg.msg({title: "	• " + embeds.length + " <a:diamond:725600667586134138>", description: input, color: "#99ffff", edit: true});
          break;

        case "756212089911247021":
          client.removeListener("messageDelete", eventFuncDelete);
          client.removeListener("message", eventFuncWrite);
          await bot_msg.reactions.removeAll();
          bot_msg.msg({title: "Пожалуйста, подождите", edit: true, delete: 5000});

          embeds.forEach(item => msg.msg({content: item.embeds[0]}).then( e => item.delete() ));
          msg.msg({title: "Готово!", delete: 2000});
          bot_msg.delete();
          return;
        default:
          client.removeListener("messageDelete", eventFuncDelete);
          client.removeListener("message", eventFuncWrite);
          return bot_msg.delete();
      }
    } while (true);

  }


	options = {
	  "name": "embeds",
	  "id": 26,
	  "media": {
	    "description": "\n\n– Знаете.. Дискорд ужасная платформа для написания документаций и другой работы с текстом при использовании ботов. Чтобы сделать маленькую поправку, зачастую нужно заново отправлять каждое сообщение.\n\nДля решения этой проблемы создана эта команда, она может:\n• Изменить порядок сообщений в канале;\n• Получать JSON объект эмбед-сообщения, для его дальнейшего редактирования;\n\n:pencil2:\n```python\n!embeds <messageID> # messageID нужен только если в канале больше 100 эмбедов\n```\n\n"
	  },
	  "allias": "эмбедс эмбеды ембеды ембедс",
		"allowDM": true,
		"type": "guild"
	};
};

export default Command;