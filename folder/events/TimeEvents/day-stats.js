import { TimeEventsManager, BossManager } from "#lib/modules/mod.js";
import { client } from "#bot/client.js";

import TreeCommand from "#folder/commands/seed.js";
import BankCommand from "#folder/commands/bank.js";
import { ending, NumberFormatLetterize } from "#src/lib/util.js";

class Event {
  run(eventData) {
    const next =
      new Date(Date.now() + 14500000).setHours(20, 0, 0) - Date.now();
    if (eventData.isLost) {
      return TimeEventsManager.create("day-stats", next);
    }

    const context = {
      treeCommand: new TreeCommand(),
      bankCommand: new BankCommand(),
      guildsStatsContext: {},
    };

    client.guilds.cache
      .filter((guild) => guild.data.treeLevel)
      .each((guild) => context.treeCommand.onDayStats(guild, context));

    client.guilds.cache.forEach((guild) => {
      this.sendStats(guild, context);
    });

    client.guilds.cache
      .filter((guild) => guild.data.professions)
      .each((guild) => {
        context.bankCommand.onDayStats(guild, context);
      });

    client.guilds.cache.each((guild) => BossManager.beforeApparance(guild));

    return TimeEventsManager.create("day-stats", next);
  }

  sendStats(guild, context) {
    const guildData = guild.data;
    const messagesOfDay = guildData.day_msg || 0;
    const { guildsStatsContext } = context;

    
    const { treeMessagesNeed } = guildsStatsContext[guild.id] || {};

    guild.data.coins += 2 * guild.memberCount;

    guildData.days = guildData.days + 1 || 1;
    guildData.msg_total = guildData.msg_total + messagesOfDay || messagesOfDay;

    let description = `За этот день было отправлено ${ending(
      messagesOfDay,
      "сообщени",
      "й",
      "е",
      "я",
    )}\nРекордное количество: ${guildData.day_max || (guildData.day_max = 0)}`;

    if (guildData.days > 3) {
      description += `\nВсего сообщений: ${NumberFormatLetterize(
        guildData.msg_total,
      )}\nВ среднем за день: ${Math.round(guildData.msg_total / guildData.days)}`;
    }

    if (guildData.day_max < messagesOfDay) {
      guildData.day_max = messagesOfDay;
      description += `\nГильдия ${[
        "<a:jeqery:768047102503944202>",
        "<a:jeqeryBlue:806176327223738409>",
        "<a:jeqeryPurple:806176181140848660>",
        "<a:jeqeryGreen:806176083757105162>",
        "<a:jeqeryRed:806175947447205958>",
        "<a:blockPink:794615199361400874>",
        "<a:blockAqua:794166748085223475>",
      ].random()} установила свой рекорд по сообщениям!`;
    }

    guildData.day_msg = 0;

    if (!messagesOfDay) {
      return;
      // description = ["Сегодня не было отправленно ни одно сообщение", "Сегодня на сервере пусто", "За целый день ни один смертный не проявил активность", "Похоже, тишина — второе имя этого сервера"].random();
    }

    if (treeMessagesNeed)
      description += `\n\nДерево засыхает! Ему необходимо на ${ending(
        treeMessagesNeed - messagesOfDay,
        "сообщени",
        "й",
        "е",
        "я",
      )} больше 💧`;

    guild.chatSend({ title: "Статистика сервера", description });
  }

  options = {
    name: "TimeEvent/day-stats",
  };
}

export default Event;
