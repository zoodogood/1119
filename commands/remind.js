import * as Util from '#src/modules/util.js';
import EventsManager from '#src/modules/EventsManager.js';
import TimeEventsManager from '#src/modules/TimeEventsManager.js';

class Command {

	async onChatInput(msg, interaction){
    const parseParams = (params) => {
      params = params.split(" ");

      const stamps = [];
      while (params.at(0)?.match(/\d+(?:д|d|ч|h|м|m|с|s)/)){
        stamps.push( ...params.splice(0, 1) );
      }
      const phrase = params.join();
      return [stamps, phrase];
    }
    const [stamps, phraseRaw] = parseParams(interaction.params);
  
    const phrase = (phraseRaw || "Без описания")
      .replace(/[a-zа-яъёь]/i, (letter) => letter.toUpperCase());

    const userData = msg.author.data;
    if (stamps.length === 0){
      const filter = (event, remindTimestamp) => event.name === "remind" && JSON.parse(event.params).at(0) === msg.author.id && event.timestamp === remindTimestamp;

      const userRemindEvents = (userData.reminds ?? []).map(timestamp => {
        const day = TimeEventsManager.Util.timestampDay(timestamp);

        const event = TimeEventsManager.at(day)?.find(
          (event) => filter(event, timestamp)
        );

        if (!event){
          const index = userData.reminds.indexOf(timestamp);
          userData.reminds.splice(index, 1);
        }
        return event ?? null;
      })
      .filter(Boolean);

      const userRemindsContentRaw = userRemindEvents.map(({params, timestamp}) => {
        const [_authorId, _channelId, phrase] = JSON.parse(params);
        return `• <t:${ Math.floor(timestamp / 1_000) }:R> — ${ phrase }.`;
      })

    
      
      const remindsContent = userRemindEvents.length ? `\n\nВаши напоминания:\n${ userRemindsContentRaw.join("\n\n").slice(0, 100) }` : "";
      const description = `Пример:\n!напомни 1ч 7м ${ phrase }${ remindsContent }`;
      const message = await msg.msg({title: "Вы не указали время, через какое нужно напомнить..",  color: "#ff0000", delete: 50000, description });
      if (userRemindEvents.length){
        const createRemoveRemindInterface = async () => {
          const react = await message.awaitReact({user: msg.author, type: "one"}, "🗑️");
          if (!react){
            return;
          }

          const answer = await message.channel.awaitMessage(msg.author, {title: `Переличите номера от 1 до ${ userRemindEvents.length } через пробел, чтобы удалить 🗑️ напоминания. Или введите любое другое содержимое, чтобы отменить`});
          if (!answer){
            return;
          }

          const numbers = [...new Set(answer.content.split(" ").filter(Boolean))];
          if (numbers.some(isNaN) || numbers.some(number => number <= 0 || number > userRemindEvents.length)){
            return msg.msg({title: "🗑️ Отменено.", delete: 5000});
          }

          const willRemoved = numbers.map(index => userData.reminds[index - 1]);
          for (const timestamp of willRemoved){
            const event = userRemindEvents.find((event) => filter(event, timestamp));
            TimeEventsManager.remove(event);
            const index = userData.reminds.indexOf(timestamp);
            if (~index === 0){
              continue;
            }

            userData.reminds.splice(index, 1);
            if (userData.reminds.length === 0){
              delete userData.reminds;
            }
            message.delete();
          }
        }
        createRemoveRemindInterface();
      }
      return;
    }

    let timeTo = 0;
    stamps.forEach(stamp => {
      switch (stamp.slice(-1)) {
        case "d":
        case "д":
          timeTo += 86400000 * stamp.slice(0, -1);
          break;
        case "h":
        case "ч":
          timeTo += 3600000 * stamp.slice(0, -1);
          break;
        case "m":
        case "м":
          timeTo += 60000 * stamp.slice(0, -1);
          break;
        case "s":
        case "с":
          timeTo += 1000 * stamp.slice(0, -1);
          break;
      }
    });
    
    const event = TimeEventsManager.create("remind", timeTo, [msg.author.id, msg.channel.id, phrase]);
    userData.reminds ||= [];
    userData.reminds.push(event.timestamp);
    msg.msg({title: "Напомнинание создано", description: `— ${ phrase }`, timestamp: event.timestamp, footer: {iconURL: msg.author.avatarURL(), text: msg.author.username}});
  }


	options = {
	  "name": "remind",
	  "id": 44,
	  "media": {
	    "description": "\n\nСоздаёт напоминание, например, выключить суп, ну или что ещё вам напомнить надо :rolling_eyes:\n\n:pencil2:\n```python\n!remind {time} {text} #Время в формате 1ч 2д 18м\n```\n\n"
	  },
	  "allias": "напомни напоминание напомнить"
	};
};

export default Command;