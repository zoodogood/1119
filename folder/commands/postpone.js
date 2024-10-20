import { PermissionsBits } from "#constants/enums/discord/permissions.js";
import { MINUTE } from "#constants/globals/time.js";
import { BaseCommand } from "#lib/BaseCommand.js";
import TimeEventsManager from "#lib/modules/TimeEventsManager.js";
import * as Util from "#lib/util.js";

class Command extends BaseCommand {
  options = {
    name: "postpone",
    id: 30,
    media: {
      description:
        "Отправляет сообщение от вашего имени в указанное время;\nУдалено в связи с тем, что время пользователей может отличатся от времени бота",
      example: `!postpone {content} {time} #время в формате 15:30`,
    },
    alias: "отложить отложи відкласти відклади",
    allowDM: true,
    expectParams: true,
    cooldown: MINUTE * 30,
    type: "delete",
    myChannelPermissions: PermissionsBits.ManageWebhooks,
  };

  async onChatInput(msg, interaction) {
    const splited = interaction.params.split(" "),
      text = splited.slice(1).join(" ");
    let time = splited[0];

    if (!text)
      return msg.msg({
        title: "Неверно введена команда",
        description:
          "Аргументами является {Время} + {Текст}\nПример: `!postpone 11:19 Я люблю мир`",
        delete: 5000,
      });
    time = time.split(":");
    if (isNaN(time[0]) || isNaN(time[1]))
      return msg.msg({
        title: "Неверно введено время",
        description: "Часы:Минуты 15:16",
        color: "#ff0000",
      });
    let date = new Date();

    date.setHours(time[0]);
    date.setMinutes(time[1]);

    const timeTo = date.getTime() - Date.now();
    if (timeTo < 60000)
      return msg.msg({
        title: `Я не могу отложить отправку на ${time.join(
          ":",
        )}, текущее время превышает или равно этой метке.\nОбратите внимание, время на сервере — ${
          ((date = new Date()), date.getHours())
        }:${date.getMinutes()}`,
        delete: 5000,
      });
    TimeEventsManager.create("postpone", timeTo, [
      msg.author.id,
      msg.channel.id,
      text,
    ]);
    msg.msg({
      title:
        "Готово! Ваше сообщение будет отправленно через " +
        Util.timestampToDate(timeTo),
      delete: 5000,
    });
  }
}

export default Command;
