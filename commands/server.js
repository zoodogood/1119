import * as Util from '#src/modules/util.js';
import EventsManager from '#src/modules/EventsManager.js';
import TimeEventsManager from '#src/modules/TimeEventsManager.js';

class Command {

	async onChatInput(msg, interaction){
    let guild = msg.guild;

    const values = {
      stats: {
        msgs:          `За сегодня: ${  guild.data.day_msg  }`,
        msgsAll:       `Всего: ${  guild.data.day_msg + guild.data.msg_total  }`,
        around:        `В среднем: ${  Math.round((guild.data.day_msg + guild.data.msg_total) / guild.data.days)  }`,
        record:        `Рекорд: ${   Util.ending(guild.data.day_max, "сообщени", "й", "е", "я")  }\n`,
        commands:      `Использовано команд: ${  Object.values(guild.data.commandsUsed).reduce((acc, count) => acc + count, 0)  }`,
        todayCommands: `Сегодня: ${  Object.values(guild.data.commandsUsed).reduce((acc, count) => acc + count, 0) - guild.data.commandsLaunched  }`
      },
      members: {
        count:         `Всего: ${guild.memberCount}`,
        online:        `Онлайн: ${guild.members.cache.filter(e => e.presence.status != "offline").size}`,
        offline:       `Оффлайн: ${guild.members.cache.filter(e => e.presence.status == "offline").size}`
      },
      channels: {
        categories:    `Категорий: ${guild.channels.cache.filter(e => e.type == "category").size}`,
        texted:        `Текстовых: ${guild.channels.cache.filter(e => e.type == "text").size}`,
        voices:        `Голосовых: ${guild.channels.cache.filter(e => e.type == "voice").size}`
      }
    }

    let stats    = Object.values( values.stats ).join("\n");
    let members  = Object.values( values.members ).join("\n");
    let channels = Object.values( values.channels ).join("\n");

    let verification = {
      "NONE": "Отсуствует",
      "LOW": "Низкий",
      "MEDIUM": "Средний",
      "HIGH": "Высокий",
      "VERY_HIGH": "Слишком высокий"
    }

    let fields = [{name: "Участники:", value: members, inline: true}, {name: "Каналы:", value: channels, inline: true}, {name: "**Статистика сообщений:**", value: stats}, {name: `**Владелец:**`, value: await guild.fetchOwner(), inline: true}, {name: `**Ур. Верификации:**`, value: verification[guild.verificationLevel], inline: true}];
    //* CLOVER
    if (guild.data.cloverEffect){

      const clover = guild.data.cloverEffect;
      const day = TimeEventsManager.Util.timestampDay(clover.timestamp);
      const filter = ({name, params}) => name === "cloverEnd" && params.includes(msg.guild.id);
      const event = TimeEventsManager.at(day).find(filter);
     
      const timeTo = event.timestamp - Date.now();
      const multiplier = 1.08 + (0.07 * ((1 - 0.9242 ** clover.uses) / (1 - 0.9242)));

      

      fields.unshift({name: "🍀 Действие Клевера", value: `Осталось времени: ${+(timeTo / 3600000).toFixed(2)}ч.\nКлевер был запущен: <t:${ Math.floor(clover.timestamp / 1_000) }>;\nНаград получено: ${clover.coins}\nТекущий множетель: X${multiplier.toFixed(2)}\nКуплено клеверов: ${clover.uses}`});
    }
    //**

    msg.msg({title: guild.name + " " + ["❤️", "🧡", "💛", "💚", "💙", "💜"].random(), thumbnail: guild.iconURL(), description: guild.data.description || "Описание не установлено <a:who:638649997415677973>\n`!editServer` для настройки сервера", footer: {text: "Сервер был создан " + Util.timestampToDate(Date.now() - guild.createdTimestamp, 3) + " назад." + "\nID: " + guild.id}, image: guild.data.banner, fields});
  }


	options = {
	  "name": "server",
	  "id": 28,
	  "media": {
	    "description": "\n\nОтображает основную информацию и статистику о сервере, в том числе бонусы связанные с этим ботом.\nВ неё входят: количество пользователей, каналов, сообщений или эффект клевера (если есть), а также установленные каналы, дата создания и другое\n\n:pencil2:\n```python\n!server #без аргументов\n```\n\n"
	  },
	  "allias": "сервер"
	};
};

export default Command;