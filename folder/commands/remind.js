import client from "#bot/client.js";
import config from "#config";
import { YEAR } from "#constants/globals/time.js";
import { BaseCommand } from "#lib/BaseCommand.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import CommandsManager from "#lib/modules/CommandsManager.js";
import TimeEventsManager from "#lib/modules/TimeEventsManager.js";
import { ParserTime } from "#lib/parsers.js";
import { dayjs, ending, capitalize } from "#lib/util.js";
import { CliParser } from "@zoodogood/utils/primitives";
import { Message } from "discord.js";

class AbstractRemindEvaluate {
  static COMMAND_FLAG_DATA = {
    name: "--eval",
    capture: ["--eval"],
    description:
      "Вызывает команду !эвал, с параметрами напоминания, через промежуток времени",
  };

  static onEvaluate(context) {
    if (!context.evaluateRemind) {
      return;
    }
    const COMMAND = "eval";
    const { name } = CommandsManager.callMap.get(COMMAND).options;
    const { user, phrase, message } = context;
    const cloneMessage = Object.create(Message.prototype);
    Object.assign(cloneMessage, {
      ...message,
      content: `!${name} ${phrase}`,
      author: user,
      client,
    });

    const commandCtx =
      CommandsManager.parseInputCommandFromMessage(cloneMessage);
    const { command } = commandCtx;
    CommandsManager.checkAvailable(command, commandCtx) &&
      CommandsManager.execute(command, commandCtx);
  }
}

class AbstractRemindRepeats {
  static DEFAULT_REPEAT_COUNT = 1;
  static COMMAND_FLAG_DATA = {
    expectValue: true,
    capture: ["--repeat", "-r"],
    name: "--repeat",
    description:
      "Позволяет повторять напоминание несколько раз, одно после завершения предыдущего. Ожидает указания количества повторений",
  };

  static LIMIT = 365;
  static REPEATED_REMINDS_LIMIT = 3;

  static processRemindRepeatsCountLimit(context) {
    const {
      channel,
      remindData: { repeatsCount, phrase },
    } = context;

    if (repeatsCount <= AbstractRemindRepeats.LIMIT) {
      return false;
    }
    channel.msg({
      color: "#ff0000",
      title: `Максимум повторов напоминания — ${AbstractRemindRepeats.LIMIT}`,
      delete: 8_000,
      description: phrase,
    });
    return true;
  }

  static message = {
    addToContentRepeatsCount: (content, remindData) =>
      `${content}${remindData.repeatsCount > 1 ? `\n\nПовторяется: ${ending(remindData.repeatsCount, "раз", "", "", "а")}` : ""}`,
    addDisclamerHowToRemove: (content) =>
      `${content}\nНапоминание можно [удалить](${config.server.origin}/pages/articles/how-to-reminds): !reminds --delete {}`,
    processMessageWithRepeat: (content, remindData, isEnd) => {
      if (!remindData.repeatsCount) {
        return content;
      }
      const { addToContentRepeatsCount, addDisclamerHowToRemove } =
        this.message;

      content = addToContentRepeatsCount(content, remindData);
      if (!isEnd && remindData.repeatsCount <= 5) {
        return content;
      }
      return addDisclamerHowToRemove(content);
    },
  };

  static recallEvent(event) {
    return RemindsManager.createEvent(event);
  }

  static processRemindTimeEvent(eventData, remindData) {
    const { repeatsCount, _phrase } = remindData;
    if (repeatsCount <= 1) {
      return;
    }

    const timeTo = Date.now() - eventData.createdAt;
    return RemindsManager.createEvent({
      ...remindData,
      repeatsCount: repeatsCount - 1,
      timeTo,
      _phrase,
    });
  }
}

class RemindsManager {
  static findUserReminds(user) {
    const userData = user.data;
    const reminds = userData.reminds ?? [];
    const compare = ({ name, _params_as_json }) =>
      name === Command.EVENT_NAME && _params_as_json.includes(user.id);
    const events = TimeEventsManager.findBulk(reminds, compare);
    return events;
  }

  static removeIfEnded(timestamp, user) {
    const now = Date.now();
    if (+timestamp > now) {
      return;
    }
    this.removeRemindFieldOfUserReminds(timestamp, user);
  }

  static removeRemindFieldOfUserReminds(timestamp, user) {
    const userData = user.data;
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

  static createEvent(remindData) {
    const { timeTo, channel, user, phrase, repeatsCount, evaluateRemind } =
      remindData;
    const userData = user.data;

    const event = TimeEventsManager.create(Command.EVENT_NAME, timeTo, [
      user.id,
      channel.id,
      phrase,
      repeatsCount,
      evaluateRemind,
    ]);

    userData.reminds ||= [];
    userData.reminds.push(event.timestamp);
    return event;
  }

  static removeEndedRemindsOfUser(user) {
    const { reminds } = user.data;
    for (const timestamp of reminds ?? []) {
      this.removeIfEnded(timestamp, user);
    }
  }
}

class RemindData {
  static DEFAULT_VALUES = {
    phrase: "Ням",
    repeatsCount: AbstractRemindRepeats.DEFAULT_REPEAT_COUNT,
    timeTo: null,
  };

  timeTo;
  channel;
  user;
  _phrase;
  _repeatsCount;
  evaluateRemind;

  static from(data) {
    const eventData = new this({});
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

  get phrase() {
    return capitalize(this._phrase || this.constructor.DEFAULT_VALUES.phrase);
  }

  set phrase(value) {
    this._phrase = value;
  }

  get repeatsCount() {
    return this._repeatsCount || this.constructor.DEFAULT_VALUES.repeatsCount;
  }

  set repeatsCount(value) {
    this._repeatsCount = value;
  }
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

    const { captures } = cliParsed;

    const params = {
      timeTo: timeParser.summarizeItems(),
      phrase: captures.get("phrase")?.toString(),
      repeatsCount: captures.get("--repeat")?.valueOfFlag(),
      deleteRemind: captures.get("--delete")?.valueOfFlag(),
      evaluateRemind: captures.get("--eval")?.toString(),
    };
    this.values = params;
    return this;
  }
  captureParamsLine() {
    const { cliParser, timeParser } = this;
    cliParser.processBrackets();
    this.setParamsCliParserParams(cliParser.context.input);
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
  paramsProcessor;
  problems = [];
  timeTo;
  phrase;
  repeatsCount;
  deleteRemind;
  evaluateRemind;
  _remindData;

  pushProblem(text) {
    this.problems.push(text);
  }

  get params() {
    return this.paramsProcessor.values;
  }

  get remindData() {
    const { user, channel } = this;
    const { timeTo, phrase, repeatsCount, evaluateRemind } = this;
    return (this._remindData ||= RemindData.from({
      timeTo,
      phrase,
      repeatsCount,
      evaluateRemind,
      user,
      channel,
    }));
  }

  static async new(interaction, command) {
    const context = new this(interaction, command);
    const { userData } = interaction;
    context.userData = userData;

    context.paramsProcessor = new ParamsProcessor(context)
      .setParamsCliParserParams(interaction.params)
      .processParams();

    Object.assign(context, context.paramsProcessor.values);
    return context;
  }
}

class Command_DeleteRemind {
  constructor(context) {
    this.context = context;
  }

  onProcess() {
    const { interaction, deleteRemind: value } = this.context;

    const { userData } = interaction;
    const { reminds } = userData;
  }
}

class Command extends BaseCommand {
  static EVENT_NAME = "remind";

  async run(context) {
    const {
      interaction,
      remindData: { timeTo, repeatsCount },
    } = context;

    if (await this.processDeleteRemindFlag(context)) {
      return;
    }

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

  async processDeleteRemindFlag(context) {
    const { deleteRemind } = context;
    if (!deleteRemind) {
      return;
    }

    await new Command_DeleteRemind(context).onProcess();
    return true;
  }

  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }

  processRemindTimeLimit(context) {
    const { channel, remindData } = context;
    const { phrase, timeTo } = remindData;
    const LIMIT = YEAR * 30;

    if (timeTo <= LIMIT) {
      return false;
    }
    channel.msg({
      color: "#ff0000",
      title: "Максимальный период — 30 лет",
      delete: 8_000,
      description: phrase,
    });
    return true;
  }

  async processCreateRemind(context) {
    const { channel, user, remindData } = context;

    if (this.processRemindTimeLimit(context)) {
      return;
    }

    if (AbstractRemindRepeats.processRemindRepeatsCountLimit(context)) {
      return;
    }

    const event = await this.createRemind(context);
    const description = `— ${AbstractRemindRepeats.message.processMessageWithRepeat(remindData.phrase, remindData, false)}`;
    await channel.msg({
      title: "Напомнинание создано",
      description,
      timestamp: event.timestamp,
      footer: {
        iconURL: user.avatarURL(),
        text: user.username,
      },
    });
  }
  async createRemind(context) {
    const { remindData } = context;

    return RemindsManager.createEvent({
      ...remindData,
      phrase: remindData._phrase,
    });
  }

  handleNotExistedReminds(notExitsted, context) {
    for (const timestamp of notExitsted) {
      RemindsManager.removeRemindFieldOfUserReminds(timestamp, context);
      const problemText = `Паника: напоминание (${dayjs(+timestamp).format(
        "DD.MM HH:mm",
      )}, ${timestamp}), а именно временная метка напоминания, существовала. Однако событие и текст, — нет, не найдены`;
      context.pushProblem(problemText);
    }
  }

  findUserRemindEvents(context) {
    const { userData, user } = context;
    RemindsManager.removeEndedRemindsOfUser(context);
    const events = RemindsManager.findUserReminds(user);
    const notExisted = userData.reminds.filter(
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
      flags: [
        AbstractRemindRepeats.COMMAND_FLAG_DATA,
        {
          name: "--delete",
          capture: ["--delete", "-d"],
          expectValue: true,
          description: "Укажите номер напоминания для его удаления",
        },
        AbstractRemindEvaluate.COMMAND_FLAG_DATA,
      ],
    },
    allowDM: true,
    cooldown: 8_000,
    cooldownTry: 5,
    type: "other",
  };
}

export {
  AbstractRemindRepeats as Remind_AbstractRepeats,
  AbstractRemindEvaluate as Remind_AbstractEvaluate,
  RemindData,
  RemindsManager,
};

export default Command;
