import client from "#bot/client.js";
import config from "#config";
import { SECOND, YEAR } from "#constants/globals/time.js";
import { BaseCommand } from "#lib/BaseCommand.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import CommandsManager from "#lib/modules/CommandsManager.js";
import TimeEventsManager from "#lib/modules/TimeEventsManager.js";
import { ParserTime } from "#lib/parsers.js";
import { dayjs, ending, capitalize, question } from "#lib/util.js";
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
    const { user, _phrase: phrase, message } = context;
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

  static processRepeatedRemindsLimit(context) {
    const { channel, remindData, membReminds } = context;

    const repeatedReminds = membReminds.filter(
      (timeEvent) =>
        timeEvent && RemindData.fromParams(timeEvent.params)._repeatsCount > 1,
    );

    const isRepeatedRemind = remindData._repeatsCount > 1;
    if (
      !isRepeatedRemind ||
      repeatedReminds.length <= AbstractRemindRepeats.REPEATED_REMINDS_LIMIT
    ) {
      return false;
    }
    channel.msg({
      color: "#ff0000",
      title: `Максимум повторяющихся напоминаний — ${AbstractRemindRepeats.REPEATED_REMINDS_LIMIT}`,
      delete: 8_000,
      description: remindData.phrase,
    });
    return true;
  }

  static processLimites(context) {
    const repeatsLimit = this.processRemindRepeatsCountLimit(context);
    const repeatedRemindsLimit = this.processRepeatedRemindsLimit(context);
    return repeatedRemindsLimit || repeatsLimit;
  }

  static message = {
    HOW_TO_REMIND_URL: `${config.server.origin}/pages/articles/item?id=how-to-reminds`,
    addToContentRepeatsCount: (content, remindData) =>
      `${content}${remindData.repeatsCount > 1 ? `\n\nПовторяется: ${ending(remindData.repeatsCount, "раз", "", "", "а")}` : ""}`,
    addDisclamerHowToRemove: (content) =>
      `${content}\nНапоминание можно [удалить](${this.message.HOW_TO_REMIND_URL}): !reminds --delete {}`,
    processMessageWithRepeat: (content, remindData) => {
      if (remindData.repeatsCount <= 1) {
        return content;
      }
      const { addToContentRepeatsCount, addDisclamerHowToRemove } =
        this.message;

      content = addToContentRepeatsCount(content, remindData);
      if (remindData.repeatsCount <= 5) {
        return content;
      }
      return addDisclamerHowToRemove(content);
    },
  };

  static processRemindTimeEvent(eventData, remindData) {
    const { _repeatsCount, _phrase } = remindData;
    if (_repeatsCount <= 1) {
      return;
    }

    const timeTo = Date.now() - eventData.createdAt;
    return RemindsManager.createEvent({
      ...remindData,
      _repeatsCount: _repeatsCount - 1,
      timeTo,
      _phrase,
    });
  }
}

class RemindsManager {
  static findUserReminds(user, reminds) {
    if (!reminds?.length) {
      return [];
    }
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
    this.removeRemind(timestamp, user.data.reminds);
  }

  static removeRemind(timestamp, remindsField) {
    if (!remindsField) {
      return;
    }
    const index = remindsField.indexOf(timestamp);
    if (~index === 0) {
      return;
    }

    remindsField.splice(index, 1);
  }

  static createEvent(remindData) {
    const { timeTo, user } = remindData;
    const userData = user.data;

    const event = TimeEventsManager.create(
      Command.EVENT_NAME,
      timeTo,
      RemindData.toParams(remindData),
    );

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

  static _removeReminds(indexes, remindsField) {
    const targets = new Set();
    for (const index of indexes) {
      if (index === "+") {
        remindsField.forEach((target) => targets.add(target));
        break;
      }
      targets.add(remindsField.at(index));
    }

    const willRemoved = [...targets.values()].filter(Boolean);
    for (const target of willRemoved) {
      this.removeRemind(target, remindsField);
    }
    return willRemoved;
  }

  static removeReminds(indexes, user) {
    const { reminds } = user.data;
    if (!reminds) {
      return [];
    }
    const willRemoved = this._removeReminds(indexes, reminds);
    if (reminds.length === 0) {
      delete user.data.reminds;
    }
    return willRemoved;
  }

  static pruneEvents(reminds, membReminds) {
    for (const timestamp of reminds) {
      const event = membReminds.find(
        (timeEvent) => timeEvent?.timestamp === timestamp,
      );
      event && TimeEventsManager.remove(event);
    }
  }
}

class RemindDataFormatter {
  static toUserString(remindData, timestamp) {
    const { phrase, channel } = remindData;
    return `• <t:${Math.floor(timestamp / SECOND)}:R> — ${phrase}.\n${channel.toString()}`;
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
  constructor({ timeTo, channel, user, phrase, repeatsCount, evaluateRemind }) {
    this.timeTo = timeTo;
    this.channel = channel;
    this.user = user;
    this.phrase = phrase;
    this.repeatsCount = repeatsCount;
    this.evaluateRemind = evaluateRemind;
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

  static toParams(remindData) {
    const { channel, user, _phrase, _repeatsCount, evaluateRemind } =
      remindData;
    return [user.id, channel.id, _phrase, _repeatsCount, evaluateRemind];
  }

  static fromParams(params) {
    const [authorId, channelId, phrase, repeatsCount, evaluateRemind] = params;
    const channel = client.channels.cache.get(channelId);
    const user = client.users.cache.get(authorId);
    return new this({
      timeTo: null,
      user,
      channel,
      phrase,
      repeatsCount,
      evaluateRemind,
    });
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

  /**
   * Capture the residue phrase.
   *
   * @param {CliParser} parser - The parser object.
   * @return {void}
   */
  captureResiduePhrase(parser) {
    parser.captureResidue({ name: "phrase" });
    const capture = parser.context.captures.get("phrase");
    capture.content = parser.context.brackets.replaceBracketsStamps(
      capture.content,
      (group) => group?.full,
    );
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
      deleteRemind: captures.get("--delete")?.toString(),
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

class MemberReminds {
  userRemindsField;
  user;
  cache = new Map();
  constructor(user) {
    this.userRemindsField = user.data.reminds;
    this.user = user;
  }

  getReminds() {
    if (!this.userRemindsField) {
      return [];
    }
    this.fill_cache();
    this.prune_cache();
    return [...this.cache.values()];
  }

  prune_cache() {
    const { userRemindsField, cache } = this;
    const needPrune = [...cache.keys()].filter(
      (timestamp) => !userRemindsField.includes(timestamp),
    );

    for (let index = 0; index < needPrune.length; index++) {
      const timestamp = needPrune[index];
      cache.delete(timestamp);
    }
  }

  fill_cache() {
    const { userRemindsField, cache } = this;
    const needUpdate = userRemindsField.filter(
      (timestamp) => !cache.has(timestamp),
    );

    const finded =
      needUpdate.length &&
      RemindsManager.findUserReminds(this.user, needUpdate);

    for (let index = 0; index < (finded || []).length; index++) {
      const timeEvent = finded[index];
      const timestamp = needUpdate[index];
      cache.set(timestamp, timeEvent);
    }
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
  _membReminds;

  pushProblem(text) {
    this.problems.push(text);
  }

  get processed_params() {
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

  get membReminds() {
    this._membReminds ||= new MemberReminds(this.user);
    return this._membReminds.getReminds();
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
  targets;
  constructor(context) {
    this.context = context;
  }

  onProcess() {
    if (!this.process_validate()) {
      return;
    }
    const removed = this.process_remove();
    this.response(
      `Удалено ${ending(removed.length, "напоминани", "й", "е", "я")}`,
    );
  }

  setValue(value) {
    this.targets = [...new Set(value.split(" ").filter(Boolean))];
    return this;
  }

  process_validate() {
    const { membReminds } = this.context;
    for (const target of this.targets) {
      if (!this.validate_target(target, membReminds)) {
        return false;
      }
    }

    return true;
  }

  validate_target(target, membReminds) {
    const match = target.match(/(-?\d+)|\+/)?.[0];
    if (!match) {
      this.response(`Не найдено индексов для удаления элементов: ${target}`, {
        color: "#ff0000",
      });
      return false;
    }
    if (match === "+") {
      return true;
    }
    const number = +match;
    const length = membReminds.length;
    if (!length) {
      this.response("У пользователя нет напоминаний для удаления", {
        color: "#ff0000",
      });
      return false;
    }
    if (number >= length || number <= -length) {
      this.response(
        `Элемент ${target} не состоит в диапазоне ${-length} < X < ${length - 1}`,
        { color: "#ff0000" },
      );
      return false;
    }
    return true;
  }

  process_remove() {
    const { interaction, membReminds, user } = this.context;
    const { reminds } = user.data;
    const removed = RemindsManager.removeReminds(
      this.targets,
      interaction.user,
    ).filter((timestamp) => !reminds.includes(timestamp));
    RemindsManager.pruneEvents(removed, membReminds);
    return removed;
  }

  response(description, { color } = {}) {
    const { channel } = this.context;
    channel.msg({
      color,
      description,
      delete: 10 * SECOND,
    });
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
      this.processDefaultBehaviour(context);
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

    await new Command_DeleteRemind(context)
      .setValue(context.deleteRemind)
      .onProcess();
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

    if (AbstractRemindRepeats.processLimites(context)) {
      return;
    }

    const event = await RemindsManager.createEvent(context.remindData);
    const description = `— ${AbstractRemindRepeats.message.processMessageWithRepeat(remindData.phrase, remindData)}`;
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

  handleNotExistedReminds(notExitsted, context) {
    const { reminds } = context.user.data;
    for (const timestamp of notExitsted) {
      RemindsManager.removeRemind(timestamp, reminds);
      const problemText = `Данные вашего напоминания (${dayjs(
        +timestamp,
      ).format("DD.MM HH:mm")}, ${timestamp}) утеряны`;
      context.pushProblem(problemText);
    }
  }

  findUserRemindEvents(context) {
    RemindsManager.removeEndedRemindsOfUser(context.user);

    const { membReminds } = context;
    const reminds = context.user.data.reminds || [];
    const notExisted = reminds.filter(
      (target) =>
        !membReminds.some((timeEvent) => timeEvent?.timestamp === target),
    );
    this.handleNotExistedReminds(notExisted, context);
    return context.membReminds;
  }

  async displayRemoveReminds(context, parentMessage) {
    const { channel, user } = context;
    const { reminds } = user.data;
    while (true) {
      const react = await parentMessage.awaitReact(
        { user, removeType: "one" },
        "🗑️",
      );
      if (!react) {
        break;
      }
      const { membReminds } = context;
      const { length } = membReminds;

      const { content } = question({
        channel,
        user,
        message: {
          title: `Для удаления, укажите индексы от ${-length} до ${length - 1} через пробел, чтобы удалить 🗑️ напоминания. Чтобы отменить, введите любое не числовое значение`,
        },
      });
      if (!content) {
        break;
      }

      new Command_DeleteRemind(context).setValue(content).onProcess();
      if (!reminds.length) {
        break;
      }
    }

    parentMessage.delete();
  }

  async processDefaultBehaviour(context) {
    const { userData, interaction } = context;
    const reminds = this.findUserRemindEvents(context);

    const userRemindsContentRaw = reminds.map(
      ({ params, timestamp }, index) => {
        /* eslint-disable-next-line no-unused-vars */
        const remindData = RemindData.fromParams(params);
        return `${index}\\. ${RemindDataFormatter.toUserString(remindData, timestamp)}`;
      },
    );
    const remindsContent = reminds.length
      ? `\n\nВаши напоминания: ${
          userData.reminds.length
        }\n${userRemindsContentRaw.join("\n")}`
      : "";

    const description = `Пример:\n!напомни 1ч 7м ${context.phrase || RemindData.DEFAULT_VALUES.phrase}${remindsContent}`;
    const message = await interaction.channel.msg({
      title: "Вы не указали время, через какое нужно напомнить..",
      color: "#ff0000",
      delete: 60_000,
      description,
    });

    if (context.membReminds.length) {
      this.displayRemoveReminds(context, message);
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
