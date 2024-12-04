import { client } from "#bot/client.js";
import {
  BossManager,
  DataManager,
  TimeEventsManager,
} from "#lib/modules/mod.js";

import BankCommand from "#folder/commands/bank.js";
import TreeCommand from "#folder/commands/seed.js";
import { MonthStatisticForEveryDayAPI } from "#folder/entities/statistic/messages/MonthStatisticForEveryDayAPI.js";
import {
  average,
  dayjs,
  ending,
  factorySummarize,
  mediana_of_unsorted,
  NumberFormatLetterize,
  trim_line_space,
} from "#src/lib/util.js";

class Event {
  options = {
    name: "TimeEvent/day-stats",
  };

  run(eventData) {
    if (eventData.isLost) {
      this.time_events_recreate();
      return;
    }

    const context = {
      treeCommand: new TreeCommand(),
      bankCommand: new BankCommand(),
      guildsStatsContext: {},
    };

    client.guilds.cache.each(async (guild) => {
      const { data } = guild;
      data.tree?.level && context.treeCommand.onDayStats(guild, context);
      data.professions && context.bankCommand.onDayStats(guild, context);
      this.sendStats(guild, context);
      MonthStatisticForEveryDayAPI.ofGuild(guild).push({
        messages: data.day_msg,
      });
      BossManager.beforeApparance(guild);
    });

    this.time_events_recreate();
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
    }

    const messages_leaders = (() => {
      let current = { value: 0, id_list: [] };
      for (const [userId, memberData] of Object.entries(guildData.members)) {
        const value = memberData.messagesToday;
        delete memberData.messagesToday;
        if (value === current.value) {
          current.id_list.push(userId);
        }
        if (value > current.value) {
          current = { value, id_list: [userId] };
        }
      }
      return current;
    })();
    messages_leaders.id_list.length &&
      (description += `\nНаибольшее число от ${messages_leaders.id_list.map((userId) => `<@${userId}>`).join(", ")}: ${messages_leaders.id_list.length === 1 ? `${ending(messages_leaders.value, "сообщени", "й", "е", "я")}` : `по ${ending(messages_leaders.value, "сообщени", "й", "ю", "я")}`}`);

    {
      const month = MonthStatisticForEveryDayAPI.ofGuild(guild).field;
      const sum = month.reduce(factorySummarize(), 0);
      if (month.length > 3) {
        description +=
          trim_line_space(`\n\n**За ${ending(month.length, "д", "ней", "ень", "ня")}**
            Всего: ${sum}
            Среднее: ${average(sum, month.length)}
            Медиана: ${mediana_of_unsorted(month)}
        `);
      }
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

  time_events_recreate() {
    const launched_events = TimeEventsManager.filterEventsInRange(
      ({ name }) => name === "day-stats",
      [DataManager.data.bot.currentDay, DataManager.data.bot.currentDay + 1],
    );

    launched_events.length > 0 &&
      launched_events.forEach(TimeEventsManager.remove.bind(TimeEventsManager));

    const next = dayjs()
      .add(1, "day")
      .set("hour", 20, "minute", 0, "second", 0)
      .diff();
    TimeEventsManager.create("day-stats", next);
  }
}

export default Event;
