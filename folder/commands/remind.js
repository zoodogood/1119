import TimeEventsManager from "#lib/modules/TimeEventsManager.js";
import { ParserTime } from "#lib/parsers.js";
import { dayjs, timestampDay } from "#lib/util.js";

class Command {
  EVENT_NAME = "remind";

  getContext(interaction) {
    const parseParams = (params) => {
      const timeParser = new ParserTime();
      const regex = RegExp(`^${timeParser.regex.source}`);

      let match;
      while ((match = params.match(regex))) {
        const { groups } = match;
        const key = ParserTime._getActiveGroupName(groups);
        const item = { key, value: groups[key] };
        timeParser.pushItem(item);
        params = params.replace(match[0], "").trim();
      }
      const phrase = params;
      return { timeParser, phrase };
    };

    const { timeParser, phrase: phraseRaw } = parseParams(interaction.params);

    const phrase = (phraseRaw || "Без описания").replace(
      /[a-zа-яъёь]/i,
      (letter) => letter.toUpperCase(),
    );

    const userData = interaction.user.data;

    return {
      timeParser,
      phraseRaw,
      phrase,
      userData,
      interaction,
      now: Date.now(),
      problems: [],
    };
  }

  stampsToTime(parser) {
    return parser.summarizeItems();
  }

  async run(interaction) {
    const context = this.getContext(interaction);
    const { phrase, timeParser, userData } = context;

    if (timeParser.items.length === 0) {
      this.displayUserRemindsInterface(context);
      return;
    }

    const timeTo = this.stampsToTime(timeParser);

    const LIMIT = 86_400_000 * 365 * 30;

    if (timeTo > LIMIT) {
      interaction.channel.msg({
        color: "#ff0000",
        title: "Максимальный период — 30 лет",
        delete: 8_000,
        description: phrase,
      });
      return;
    }

    const event = TimeEventsManager.create(this.EVENT_NAME, timeTo, [
      interaction.user.id,
      interaction.channel.id,
      phrase,
    ]);

    userData.reminds ||= [];
    userData.reminds.push(event.timestamp);
    interaction.channel.msg({
      title: "Напомнинание создано",
      description: `— ${phrase}`,
      timestamp: event.timestamp,
      footer: {
        iconURL: interaction.user.avatarURL(),
        text: interaction.user.username,
      },
    });
  }

  async onChatInput(msg, interaction) {
    this.run(interaction);
  }

  removeByTimestampIfEnded(timestamp, context) {
    const { now } = context;
    if (+timestamp > now) {
      return;
    }
    this.removeRemindFieldOfUserReminds(timestamp, context);
  }

  removeRemindFieldOfUserReminds(timestamp, context) {
    const { userData } = context;
    const { reminds } = userData;
    if (!reminds) {
      return;
    }
    const index = reminds.indexOf(timestamp);
    if (~index === 0) {
      return;
    }

    reminds.splice(index, 1);
  }

  findUserRemindEvents(context) {
    const { userData, interaction } = context;
    const userId = interaction.user.id;
    const compare = ({ name, params, timestamp }, targetTimestamp) =>
      timestamp === targetTimestamp &&
      name === this.EVENT_NAME &&
      JSON.parse(params).at(0) === userId;

    const events = [];
    for (const timestamp of userData.reminds ?? []) {
      this.removeByTimestampIfEnded(timestamp, context);
      const day = timestampDay(timestamp);
      const dayEvents = TimeEventsManager.at(day);
      const event = dayEvents?.find((event) => compare(event, timestamp));

      if (!event) {
        this.removeByTimestampIfEnded(timestamp, context);
        const problem = `Паника: напоминание (${dayjs(+timestamp).format(
          "DD.MM HH:mm",
        )}, ${timestamp}), а именно временная метка напоминания, существовала. Однако событие и текст, — нет, не найдены`;
        this.contextPushProblem(context, problem);
      }
      events.push(event);
    }
    return events;
  }

  contextPushProblem(context, problem) {
    context.problems.push(problem);
  }

  async displayUserRemindsInterface(context) {
    const { userData, interaction } = context;
    const remindEvents = this.findUserRemindEvents(context);
    const userRemindsContentRaw = remindEvents.map(({ params, timestamp }) => {
      /* eslint-disable-next-line no-unused-vars */
      const [_authorId, _channelId, phrase] = JSON.parse(params);
      return `• <t:${Math.floor(timestamp / 1_000)}:R> — ${phrase}.`;
    });
    const remindsContent = userData.reminds.length
      ? `\n\nВаши напоминания: ${
          userData.reminds.length
        }\n${userRemindsContentRaw.join("\n\n").slice(0, 100)}`
      : "";

    const description = `Пример:\n!напомни 1ч 7м ${context.phrase}${remindsContent}`;
    const message = await interaction.channel.msg({
      title: "Вы не указали время, через какое нужно напомнить..",
      color: "#ff0000",
      delete: 60_000,
      description,
    });
    if (remindEvents.length) {
      const createRemoveRemindInterface = async () => {
        const react = await message.awaitReact(
          { user: interaction.user, removeType: "one" },
          "🗑️",
        );
        if (!react) {
          return;
        }

        const questionMessage = await interaction.channel.msg({
          title: `Для удаления, укажите индексы от 1 до ${remindEvents.length} через пробел, чтобы удалить 🗑️ напоминания. Чтобы отменить, введите любое не числовое значение`,
        });
        const answer = await message.channel.awaitMessage({
          user: interaction.user,
        });
        questionMessage.delete();
        if (!answer) {
          return;
        }
        const numbers = [...new Set(answer.content.split(" ").filter(Boolean))];
        if (
          numbers.some(isNaN) ||
          numbers.some((number) => number <= 0 || number > remindEvents.length)
        ) {
          return interaction.channel.msg({
            title: "🗑️ Отменено.",
            delete: 5_000,
          });
        }

        const willRemoved = numbers.map((index) => userData.reminds[index - 1]);
        for (const timestamp of willRemoved) {
          const event = remindEvents.find(
            (event) => event.timestamp === timestamp,
          );
          TimeEventsManager.remove(event);
          this.removeByTimestampIfEnded(timestamp, context);
          if (userData.reminds.length === 0) {
            delete userData.reminds;
          }
          message.delete();
        }
      };
      createRemoveRemindInterface();
    }
    return;
  }

  options = {
    name: "remind",
    id: 44,
    media: {
      description:
        "\n\nСоздаёт напоминание, например, выключить суп, ну или что ещё вам напомнить надо :rolling_eyes:\n\n✏️\n```python\n!remind {time} {text} #Время в формате 1ч 2д 18м\n```\n\n",
    },
    alias:
      "напомни напоминание напомнить нагадай нагадування нагадайко нап rem",
    allowDM: true,
    cooldown: 8_000,
    cooldownTry: 5,
    type: "other",
  };
}

export default Command;
