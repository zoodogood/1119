import * as Util from '#src/modules/util.js';
import EventsManager from '#src/modules/EventsManager.js';
import TimeEventsManager from '#src/modules/TimeEventsManager.js';

class Command {

	async onChatInput(msg, interaction){
    let message = await msg.msg({title: "🌲 Создание раздачи", description: "Используйте реакции ниже, чтобы настроить раздачу!\n◖🪧  Текст 🚩\n◖⏰  Дата окончания 🚩\n◖🎉  Кол-во победителей\n◖🎁  Выдаваемые роли", color: "#4a7e31", footer: {text: "🚩 Обязательные пункты перед началом"}});
    let react, answer, timestamp, title, descr, winners = 1, role;
    let _questionMessage;
    do {
      react = await message.awaitReact({user: msg.author, removeType: "one"}, "🪧", "⏰", "🎉", "🎁", (timestamp && descr) ? "640449832799961088" : null);
      switch (react) {
        case "🪧":
          _questionMessage = await msg.msg({title: `Укажите заглавие`});
          answer = await msg.channel.awaitMessage({user: msg.author});
          _questionMessage.delete();
          if (!answer) return;
          title = answer.content;

          _questionMessage = await msg.msg({title: `Укажите ${descr ? "новое " : ""}описание этой раздачи`, description: descr ? "Старое: " + descr : ""});
          answer = await msg.channel.awaitMessage({user: msg.author, time: 1_800_000});
          _questionMessage.delete();

          if (!answer) return;
          descr = answer.content;
          break;
        case "⏰":
          let parse = new Date();
          _questionMessage = await msg.msg({title: `Установите дату и время конца ивента`, description: `Вы можете указать что-то одно, числа разделенные точкой будут считаться датой, двоеточием — время\n**Вот несколько примеров:**\n22:00 — только время\n31.12 — только дата\n11:11 01.01 — дата и время\nОбратите внимание! Время сервера (${new Intl.DateTimeFormat("ru-ru", {weekday: "short", hour: "2-digit", minute: "2-digit"}).format(parse)}) может отличается от вашего`});
          answer = await msg.channel.awaitMessage({user: msg.author});
          _questionMessage.delete();

          if (!answer) {
            return;
          }

          let co = answer.content;
          let finded = [co.match(/(?<=\.)\d\d/), co.match(/\d\d(?=\.)/), co.match(/\d\d(?=:)/), co.match(/(?<=:)\d\d/)].map(e => e ? e[0] : undefined);
          if (!finded.some(e => e)) {
            msg.msg({title: "Нам неудалось найти ни одной метки времени, попробуйте ещё раз", color: "#ff0000", delete: 4000})
            break;
          }
          let [month = parse.getMonth() + 1, days = parse.getDate(), hours = parse.getHours(), minutes = 0] = finded;
          timestamp = new Date(parse.getFullYear(), month - 1, days, hours, minutes, 0);
          if (timestamp.getTime() - Date.now() < 0) {
            let messageSetYear = await msg.msg({title: "Эта дата уже прошла, хотите установить на следующий год?"});
            react = await messageSetYear.awaitReact({user: msg.author, removeType: "all"}, "685057435161198594", "763807890573885456");
            messageSetYear.delete();
            if (react == "685057435161198594") timestamp += 31536000000;
            else {
              msg.msg({title: "Операция отменена", delete: 4000});
              break;
            }
          }
          timestamp = timestamp.getTime();
          const title = `Готово! Времени до окончания ~${Util.timestampToDate(timestamp - Date.now(), 3)}`;
          msg.msg({title, delete: 3000, timestamp});
          break;
        case "🎉":
          _questionMessage = await msg.msg({title: `Введите количество возможных победителей`});
          answer = await msg.channel.awaitMessage({user: msg.author});
          _questionMessage.delete();
          if (!answer) {
            return;
          }
          if (isNaN(answer.content)) {
            msg.msg({title: "Указано не число", color: "#ff0000", delete: 3000});
            break;
          }
          winners = Number(answer.content);
          break;
        case "🎁":
          _questionMessage = await msg.msg({title: `Упомяните роль или введите её айди`})
          answer = await msg.channel.awaitMessage({user: msg.author});
          _questionMessage.delete();
          
          if (!answer) return;
          role = answer.content.match(/(?:<@&)?(\d+)>?/)[1];
          break;
        case "640449832799961088":
          let giveaway = await msg.msg({title, description: descr, timestamp, reactions: ["🌲"], color: "#4a7e31", footer: {text: "Окончание раздачи: "}});
          TimeEventsManager.create("giveaway", timestamp - Date.now(), [msg.channel.id, giveaway.id, winners, role]);
        default:
          await Util.sleep(1000);
          message.delete();
          return;
      }
      let description = message.embeds[0].description.replace(react, "<a:yes:763371572073201714>");
      if (description != message.embeds[0].description) message.msg({title: "🌲 Создание раздачи", edit: true, color: "#4a7e31", description: description});
    } while(react);
  }


	options = {
	  "name": "giveaway",
	  "id": 45,
	  "media": {
	    "description": "\n\nХотите порадовать участников сервера? Поднять планку ажиотажа? :tada:\nС помощью этой команды вы сможете разыграть награду между пользователями, а какую именно — решать только вам, будь это роль, ключик от игры или мешочек коинов?\n\n❓ Чтобы участвовать пользователи нажимают реакцию под появившимся сообщением, и через указанное время среди всех, кто это сделал случайно будет один или несколько победителей.\n\n:pencil2:\n```python\n!giveaway #без аргументов\n```\n\n"
	  },
	  "allias": "раздача розыгрыш",
		"allowDM": true,
		"type": "guild",
		"Permissions": 32
	};
};

export default Command;