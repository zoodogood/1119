import * as Util from '#src/modules/util.js';
import EventsManager from '#src/modules/EventsManager.js';
import TimeEventsManager from '#src/modules/TimeEventsManager.js';

class Command {

	async onChatInput(msg, interaction){
    let
      splited = interaction.params.split(" "),
      time = splited[0],
      text = splited.slice(1).join(" ");

    if (!text) return msg.msg({title: "Неверно введена команда", description: "Аргументами является {Время} + {Текст}\nПример: `!postpone 11:19 Я люблю мир`", delete: 5000});
    time = time.split(":");
    if (isNaN(time[0]) || isNaN(time[1])) return msg.msg({title: "Неверно введено время", description: "Часы:Минуты 15:16", color: "#ff0000"});
    let date = new Date();

    date.setHours(time[0]);
    date.setMinutes(time[1]);

    let timeTo = date.getTime() - Date.now();
    if (timeTo < 60000) return msg.msg({title: `Я не могу отложить отправку на ${time.join(":")}, текущее время превышает или равно этой метке.\nОбратите внимание, время на сервере — ${(date = new Date()), date.getHours()}:${date.getMinutes()}`, delete: 5000});
    TimeEventsManager.create("postpone", timeTo, [msg.author.id, msg.channel.id, text]);
    msg.msg({title: "Готово! Ваше сообщение будет отправленно через " + Util.timestampToDate(timeTo), delete: 5000});
  }


	options = {
	  "name": "postpone",
	  "id": 30,
	  "media": {
	    "description": "\n\nОтправляет сообщение от вашего имени в указанное время;\nУдалено в связи с тем, что время пользователей может отличатся от времени бота\n\n:pencil2:\n```python\n!postpone {content} {time} #время в формате 15:30\n```\n\n"
	  },
	  "allias": "отложить отложи",
		"allowDM": true,
		"expectParams": true,
		"cooldown": 1800000000,
		"type": "delete",
		"myChannelPermissions": 536870912
	};
};

export default Command;