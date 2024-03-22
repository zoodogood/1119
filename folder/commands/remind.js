import { YEAR } from "#constants/globals/time.js";
import { BaseCommand } from "#lib/BaseCommand.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import TimeEventsManager from "#lib/modules/TimeEventsManager.js";
import { ParserTime } from "#lib/parsers.js";
import { dayjs, ending, capitalize } from "#lib/util.js";
import { CliParser } from "@zoodogood/utils/primitives";

class AbstractRemindRepeats {
  static DEFAULT_REPEAT_COUNT = 1;
  static COMMAND_FLAG_DATA = {
    expectValue: true,
    capture: ["--repeat", "-r"],
    name: "--repeat",
    description:
      "Позволяет повторять напоминание несколько раз, одно после завершения предыдущего. Ожидает указания количества повторений",
  };

  static recallEvent(event) {
    return createEvent(
      event.timeTo,
      event.channel,
      event.user,
      event.phrase,
      event.repeatsCount,
    );
  }

  static processRemindTimeEvent(
    eventData,
    channel,
    user,
    phrase,
    repeatsCount,
  ) {
    if (repeatsCount <= 1) {
      return;
    }

    const timeTo = Date.now() - eventData.createdAt;
    return createEvent({
      channel,
      user,
      phrase,
      repeatsCount: repeatsCount - 1,
      timeTo,
    });
  }
}

class RemindData {
  static DEFAULT_VALUES = {
    phrase: "ням",
    repeatsCount: AbstractRemindRepeats.DEFAULT_REPEAT_COUNT,
    timeTo: null,
  };

  timeTo;
  channel;
  user;
  phrase;
  repeatsCount;
  static from(data) {
    const eventData = new this();
    Object.assign(eventData, data);
    return eventData;
  }
  constructor({ timeTo, channel, user, phrase, repeatsCount }) {
    this.timeTo = timeTo;
    this.channel = channel;
    this.user = user;
    this.phrase = phrase;
    this.repeatsCount = repeatsCount;
  }
}
function createEvent(remindData) {
  const { timeTo, channel, user, phrase, repeatsCount } = remindData;
  const userData = user.data;

  const event = TimeEventsManager.create(Command.EVENT_NAME, timeTo, [
    user.id,
    channel.id,
    phrase,
    repeatsCount,
  ]);

  userData.reminds ||= [];
  userData.reminds.push(event.timestamp);
  return event;
}

class ParamsProcessor {
  cliParser = new CliParser();
  timeParser = new ParserTime();
  cliParserParams = null;
  values;

  constructor(context) {
    this.context = context;
  }

  setParamsCliParserParams(params) {
    this.cliParserParams = params;
    this.cliParser.setText(params);
    return this;
  }

  captureFlags(parser) {
    const {
      context: { command },
    } = this;
    parser.captureFlags(command.options.cliParser.flags);
  }

  captureTime(timeParser) {
    let { cliParserParams: params } = this;
    const regex = RegExp(`(?:^s*)${timeParser.regex.source}`);

    let match;
    while ((match = params.match(regex))) {
      const { groups } = match;
      const key = ParserTime._getActiveGroupName(groups);
      const item = { key, value: groups[key] };
      timeParser.pushItem(item);
      params = params.replace(match[0], "").trim();
    }

    this.setParamsCliParserParams(params);
    return params;
  }

  captureResiduePhrase(parser) {
    parser.captureResidue({ name: "phrase" });
  }
  processParams() {
    this.captureParamsLine();
    const {
      timeParser,
      cliParser: { context: cliParsed },
    } = this;
    const timeTo = timeParser.summarizeItems();

    const repeatsCount =
      cliParsed.captures.get("--repeat")?.content.groups.value;

    const phrase = cliParsed.captures.get("phrase")?.content;

    const params = { timeTo, repeatsCount, phrase };
    this.values = params;
    return this;
  }
  captureParamsLine() {
    const { cliParser, timeParser } = this;
    // stage 1
    this.captureFlags(cliParser);
    this.setParamsCliParserParams(cliParser.context.input);
    // stage 2
    const _temp1_params = this.captureTime(timeParser);
    this.setParamsCliParserParams(_temp1_params);
    // stagw 3
    this.captureResiduePhrase(cliParser);
    this.setParamsCliParserParams(cliParser.context.input);
    return this;
  }
}

class CommandRunContext extends BaseCommandRunContext {
  now = Date.now();
  problems = [];
  pushProblem(text) {
    this.problems.push(text);
  }

  get params() {
    return this.paramsProcessor.values;
  }

  static async new(interaction, command) {
    const context = new this(interaction, command);
    const { userData } = interaction;
    context.userData = userData;

    context.paramsProcessor = new ParamsProcessor(context)
      .setParamsCliParserParams(interaction.params)
      .processParams();

    return context;
  }
}

class Command extends BaseCommand {
  static EVENT_NAME = "remind";

  async run(context) {
    const {
      interaction,
      params: { timeTo, repeatsCount },
    } = context;

    if (!timeTo) {
      this.displayUserRemindsInterface(context);
      return;
    }

    if (repeatsCount && isNaN(repeatsCount)) {
      interaction.channel.msg({
        content:
          "Флаг <Повторяющееся напоминание> (-r|--repeat) должно состоять только из цифр",
      });
      return;
    }

    await this.processCreateRemind(context);
    return context;
  }

  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }

  async processCreateRemind(context) {
    const { channel, user, params } = context;
    const phrase = capitalize(
      params.phrase || RemindData.DEFAULT_VALUES.phrase,
    );

    const { timeTo, repeatsCount } = params;

    const LIMIT = YEAR * 30;

    if (timeTo > LIMIT) {
      channel.msg({
        color: "#ff0000",
        title: "Максимальный период — 30 лет",
        delete: 8_000,
        description: phrase,
      });
      return;
    }

    const event = this.createRemind(context);

    await channel.msg({
      title: "Напомнинание создано",
      description: `— ${phrase}${repeatsCount ? `\n\nПовторяется: ${ending(repeatsCount, "раз", "", "", "а")}` : ""}`,
      timestamp: event.timestamp,
      footer: {
        iconURL: user.avatarURL(),
        text: user.username,
      },
    });
  }
  async createRemind(context) {
    const {
      user,
      channel,
      params: { phrase, timeTo, repeatsCount },
    } = context;

    return createEvent({ timeTo, channel, user, phrase, repeatsCount });
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

  handleNotExistedReminds(notExitsted, context) {
    for (const timestamp of notExitsted) {
      this.removeRemindFieldOfUserReminds(timestamp, context);
      const problemText = `Паника: напоминание (${dayjs(+timestamp).format(
        "DD.MM HH:mm",
      )}, ${timestamp}), а именно временная метка напоминания, существовала. Однако событие и текст, — нет, не найдены`;
      context.pushProblem(problemText);
    }
  }

  handleEndedReminds(context) {
    const { userData } = context;
    for (const timestamp of userData.reminds ?? []) {
      this.removeByTimestampIfEnded(timestamp, context);
    }
  }

  findUserRemindEvents(context) {
    const { userData, interaction } = context;
    const userId = interaction.user.id;
    this.handleEndedReminds(context);
    const reminds = userData.reminds ?? [];
    const compare = ({ name, _params_as_json }) =>
      name === Command.EVENT_NAME && _params_as_json.includes(userId);
    const events = TimeEventsManager.findBulk(reminds, compare).filter(Boolean);
    const notExisted = reminds.filter(
      (target) => !events.some(({ timestamp }) => target === timestamp),
    );
    this.handleNotExistedReminds(notExisted, context);
    return events;
  }

  async displayRemoveRemindInterface(context, parentMessage) {
    const { interaction, remindEvents, userData } = context;
    const react = await parentMessage.awaitReact(
      { user: interaction.user, removeType: "one" },
      "🗑️",
    );
    if (!react) {
      return;
    }

    const questionMessage = await interaction.channel.msg({
      title: `Для удаления, укажите индексы от 1 до ${remindEvents.length} через пробел, чтобы удалить 🗑️ напоминания. Чтобы отменить, введите любое не числовое значение`,
    });
    const answer = await parentMessage.channel.awaitMessage({
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
      const event = remindEvents.find((event) => event.timestamp === timestamp);
      TimeEventsManager.remove(event);
      this.removeByTimestampIfEnded(timestamp, context);
      if (userData.reminds.length === 0) {
        delete userData.reminds;
      }
      parentMessage.delete();
    }
  }

  async displayUserRemindsInterface(context) {
    const { userData, interaction } = context;
    context.remindEvents = this.findUserRemindEvents(context);
    const userRemindsContentRaw = context.remindEvents.map(
      ({ params, timestamp }) => {
        /* eslint-disable-next-line no-unused-vars */
        const [_authorId, _channelId, phrase] = params;
        return `• <t:${Math.floor(timestamp / 1_000)}:R> — ${phrase}.`;
      },
    );
    const remindsContent = userData.reminds.length
      ? `\n\nВаши напоминания: ${
          userData.reminds.length
        }\n${userRemindsContentRaw.join("\n\n").slice(0, 100)}`
      : "";

    const description = `Пример:\n!напомни 1ч 7м ${context.phrase || RemindData.DEFAULT_VALUES.phrase}${remindsContent}`;
    const message = await interaction.channel.msg({
      title: "Вы не указали время, через какое нужно напомнить..",
      color: "#ff0000",
      delete: 60_000,
      description,
    });

    if (context.remindEvents.length) {
      this.displayRemoveRemindInterface(context, message);
    }

    if (context.problems.length) {
      interaction.channel.msg({
        description: context.problems.join("\n"),
        color: "#ff0000",
        delete: 30_000,
      });
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
    cliParser: {
      flags: [AbstractRemindRepeats.COMMAND_FLAG_DATA],
    },
    allowDM: true,
    cooldown: 8_000,
    cooldownTry: 5,
    type: "other",
  };
}

export { AbstractRemindRepeats, RemindData };

export default Command;
