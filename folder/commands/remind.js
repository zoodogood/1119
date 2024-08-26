// @ts-check
import client from "#bot/client.js";
import config from "#config";
import { SECOND, YEAR } from "#constants/globals/time.js";
import { BaseCommand, BaseFlagSubcommand } from "#lib/BaseCommand.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { dayjs_ensure_coming_year } from "#lib/dayjs.js";
import { Pager } from "#lib/DiscordPager.js";
import { getValuesByIndexes } from "#lib/features/primitives.js";
import CommandsManager from "#lib/modules/CommandsManager.js";
import TimeEventsManager from "#lib/modules/TimeEventsManager.js";
import { ParserTime } from "#lib/parsers.js";
import { capitalize, clone, ending, question } from "#lib/util.js";
import { CliParser } from "@zoodogood/utils/primitives";
import dayjs from "dayjs";
import { Message } from "discord.js";

// MARK: Definitions

/**
 * =============================================================================
 * remindField = MemberRemindField
 * remindData = RemindData
 * memberRemindsField = userData.reminds
 * timeEvent = #folder/events/TimeEvents/remind
 * =============================================================================
 */

function remindFields(user) {
  return (user.data.reminds || []).map((remindDataRaw) =>
    MemberRemindField.fromUser(user, remindDataRaw.timestamp),
  );
}

// MARK: Abstract
class AbstractRemindEvaluate {
  static COMMAND_FLAG_DATA = {
    name: "--eval",
    capture: ["--eval"],
    description:
      "Вызывает команду !эвал, с параметрами напоминания, через промежуток времени",
  };

  static onEvaluate(context) {
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

  static onTimeEvent(context) {
    if (!context.evaluateRemind) {
      return;
    }

    this.onEvaluate(context);
  }
}

class AbstractRemindRepeats {
  static COMMAND_FLAG_DATA = {
    expectValue: true,
    capture: ["--repeat", "-r"],
    name: "--repeat",
    description:
      "Позволяет повторять напоминание несколько раз, одно после завершения предыдущего. Ожидает указания количества повторений",
  };
  static DEFAULT_REPEAT_COUNT = 0;

  static LIMIT = 365;
  static message = {
    HOW_TO_REMIND_URL: `${config.server.origin}/pages/articles/item?id=how-to-reminds`,
    addToContentRepeatsCount: (content, remindData) =>
      `${content}${remindData.repeatsCount > 0 ? `\n\nПовторяется: ${ending(remindData.repeatsCount + 1, "раз", "", "", "а")}` : ""}`,
    addDisclamerHowToDelete: (content) =>
      `${content}\nНапоминание можно [удалить](${this.message.HOW_TO_REMIND_URL}): !reminds --delete {}`,
    processMessageWithRepeat: (content, remindData) => {
      if (!remindData.repeatsCount) {
        return content;
      }
      const { addToContentRepeatsCount, addDisclamerHowToDelete } =
        this.message;

      content = addToContentRepeatsCount(content, remindData);
      const DISCLAMER_THRESHOLD = 5;
      if (remindData.repeatsCount <= DISCLAMER_THRESHOLD) {
        return content;
      }
      return addDisclamerHowToDelete(content);
    },
  };

  static REPEATED_REMINDS_LIMIT = 3;

  static process_recreate(eventData, remindField) {
    const { remindData } = remindField;
    const { repeatsCount } = remindData;
    if (!repeatsCount) {
      return;
    }

    const timeTo = Date.now() - eventData.createdAt;
    const { user } = remindField;
    return MemberRemindField.create(user, {
      remindData: Object.assign(clone(remindData), {
        _repeatsCount: repeatsCount - 1,
        isDeleted: false,
      }),
      timeTo,
    });
  }

  static processLimites(remindData, context) {
    const repeatsLimit = this.processRemindRepeatsCountLimit(
      remindData,
      context,
    );
    const repeatedRemindsLimit = this.processRepeatedRemindsLimit(
      remindData,
      context,
    );
    return repeatedRemindsLimit && repeatsLimit;
  }

  static processRemindRepeatsCountLimit(remindData, context) {
    const { channel } = context;
    const { phrase, repeatsCount } = remindData;

    if (repeatsCount <= AbstractRemindRepeats.LIMIT) {
      return true;
    }
    channel.msg({
      color: "#ff0000",
      title: `Максимум повторов напоминания — ${AbstractRemindRepeats.LIMIT}`,
      delete: 8_000,
      description: phrase,
    });
    return false;
  }

  static processRepeatedRemindsLimit(remindData, context) {
    const { channel } = context;

    const repeatedReminds = remindFields(context.user).filter(
      ({ remindData }) => remindData._repeatsCount > 1,
    );

    const isRepeatedRemind = remindData._repeatsCount > 1;
    if (
      !isRepeatedRemind ||
      repeatedReminds.length <= AbstractRemindRepeats.REPEATED_REMINDS_LIMIT
    ) {
      return true;
    }
    channel.msg({
      color: "#ff0000",
      title: `Максимум повторяющихся напоминаний — ${AbstractRemindRepeats.REPEATED_REMINDS_LIMIT}`,
      delete: 8_000,
      description: remindData.phrase,
    });
    return false;
  }
}

// MARK: Formatter
class RemindDataFormatter {
  static toUserString(remindData) {
    const { phrase, channel, timestamp } = remindData;
    return `• <t:${Math.floor(timestamp / SECOND)}:R> — ${phrase}.\n${channel.toString()}`;
  }
}

// MARK: RemindData
class RemindData {
  static DEFAULT_VALUES = {
    phrase: "Ням",
    repeatsCount: AbstractRemindRepeats.DEFAULT_REPEAT_COUNT,
    timeTo: null,
  };

  _phrase;
  _repeatsCount;
  #channel;
  channelId;
  evaluateRemind;
  isDeleted;

  timestamp;

  constructor({
    channelId,
    phrase,
    repeatsCount,
    evaluateRemind,
    timestamp,
    isDeleted,
  }) {
    this.channelId = channelId;
    this.phrase = phrase;
    this.repeatsCount = repeatsCount;
    this.evaluateRemind = evaluateRemind;
    this.timestamp = timestamp;
    this.isDeleted = isDeleted;
  }

  delete() {
    this.isDeleted = true;
  }

  toJSON() {
    return {
      channelId: this.channelId,
      phrase: this._phrase,
      repeatsCount: this._repeatsCount,
      evaluateRemind: this.evaluateRemind,
      timestamp: this.timestamp,
      isDeleted: this.isDeleted,
    };
  }

  get channel() {
    if (!this.#channel) {
      this.#channel = client.channels.cache.get(this.channelId);
    }
    return this.#channel;
  }

  set channel(channel) {
    this.#channel = channel;
    this.channelId = channel.id;
  }
  get phrase() {
    return capitalize(this._phrase || RemindData.DEFAULT_VALUES.phrase);
  }

  set phrase(value) {
    this._phrase = value;
  }

  get repeatsCount() {
    return this._repeatsCount || RemindData.DEFAULT_VALUES.repeatsCount;
  }

  set repeatsCount(value) {
    this._repeatsCount = value;
  }
}

// MARK: MemberRemindField
class MemberRemindField {
  remindData;
  remindDataField;
  removed;
  timeEvent = null;
  user;
  userRemindsField;
  constructor({ user, userRemindsField, remindData, remindDataField }) {
    this.user = user;
    this.userRemindsField = userRemindsField;
    this.remindData = remindData;
    this.remindDataField = remindDataField;
  }

  static create(user, { remindData, timeTo }) {
    const event = TimeEventsManager.create(Command.EVENT_NAME, timeTo, user.id);
    const userRemindsField = (user.data.reminds ||= []);
    remindData.timestamp = event.timestamp;
    userRemindsField.push(remindData.toJSON());
    const remindField = this.fromUser(user, event.timestamp);
    remindField.setTimeEvent(event);
    return remindField;
  }

  static from(data) {
    return new this({ ...data });
  }

  static fromTimeEvent(timeEvent) {
    const { params: userId, timestamp } = timeEvent;
    const user = client.users.cache.get(userId);
    const field = user && this.fromUser(user, timestamp);
    if (!field) {
      return null;
    }
    field.setTimeEvent(timeEvent);
    return field;
  }

  static fromUser(user, timestamp) {
    const userRemindsField = (user.data.reminds ||= []);
    const remindDataField = userRemindsField.find(
      ({ timestamp: target }) => target === timestamp,
    );

    if (!remindDataField) {
      return null;
    }
    const remindData = new RemindData(remindDataField);
    return new this({ user, userRemindsField, remindData, remindDataField });
  }

  selfIndex() {
    const { userRemindsField, remindData } = this;
    const target = remindData.timestamp;
    return userRemindsField.findIndex(({ timestamp }) => timestamp === target);
  }

  selfRemove() {
    this.remindData.delete();
    this.userRemindsField.splice(this.selfIndex(), 1);
  }

  setTimeEvent(value) {
    this.timeEvent = value;
  }
}

// MARK: ParamsProcessor
class ParamsProcessor {
  cliParser = new CliParser();
  cliParserParams = null;
  timeParser = new ParserTime();
  values;

  constructor(context) {
    this.context = context;
  }

  captureFlags(parser) {
    const {
      context: { command },
    } = this;
    parser.captureFlags(command.options.cliParser.flags);
  }

  captureParamsLine() {
    const { cliParser, timeParser } = this;
    // brackets
    cliParser.processBrackets();
    this.setParamsCliParserParams(cliParser.context.input);
    // flags
    this.captureFlags(cliParser);
    this.setParamsCliParserParams(cliParser.context.input);
    // time
    const _temp1_params = this.captureTime(timeParser);
    this.setParamsCliParserParams(_temp1_params);
    // residue
    this.captureResiduePhrase(cliParser);
    this.setParamsCliParserParams(cliParser.context.input);
    return this;
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
      // @ts-expect-error
      capture.content,
      (group) => group?.full,
    );
  }

  captureTime(timeParser) {
    let { cliParserParams: params } = this;
    const regex = RegExp(`(?:^s*)${timeParser.regex.source}`);

    let match;
    while ((match = params.match(regex))) {
      const { groups, ["0"]: full } = match;
      const key = ParserTime._getActiveGroupName(groups);
      const item = { key, value: groups[key] };
      timeParser.pushItem(item);
      params = params.replace(full, "").trim();
    }

    if (!timeParser.items.length) {
      this.setParamsCliParserParams(params);
      return params;
    }

    const summarize = timeParser.summarizeItems();
    timeParser.date = dayjs_ensure_coming_year(dayjs(summarize + Date.now()));

    this.setParamsCliParserParams(params);
    return params;
  }
  processParams() {
    if (!this.cliParserParams) {
      this.values = {};
      return this;
    }

    this.captureParamsLine();
    const {
      timeParser,
      cliParser: { context: cliParsed },
    } = this;

    const { captures } = cliParsed;

    const params = {
      timeTo: timeParser.diffDateTime(Date.now()),
      phrase: captures.get("phrase")?.toString(),
      // @ts-expect-error
      repeatsCount: captures.get("--repeat")?.valueOfFlag() - 1 || undefined,
      deleteRemind: captures.get("--delete")?.toString(),
      evaluateRemind: captures.get("--eval")?.toString(),
    };

    this.values = params;
    return this;
  }
  setParamsCliParserParams(params) {
    this.cliParserParams = params;
    this.cliParser.setText(params);
    return this;
  }
}

// MARK: CommandRunContext
class CommandRunContext extends BaseCommandRunContext {
  _remindFields;
  paramsProcessor;
  userData;

  static async new(interaction, command) {
    const context = new this(interaction, command);
    const { userData } = interaction;
    context.userData = userData;

    context.paramsProcessor = new ParamsProcessor(context)
      .setParamsCliParserParams(interaction.params)
      .processParams();
    return context;
  }

  get remindFields() {
    return (this._remindFields ||= remindFields(this.user));
  }
}

// MARK: DeleteRemind
class DeleteRemind_FlagSubcommand extends BaseFlagSubcommand {
  delete(indexes) {
    getValuesByIndexes(indexes);
  }

  indexes(value) {
    return [...value.split(" ")].filter((part) => /^(?:\d+|\+)$/.test(part));
  }

  indexes_exists(indexes) {
    if (indexes.length) {
      return true;
    }
    this.context.interaction.msg({
      description: "Вы не указали индексы для удаления",
      color: "#ff0000",
      delete: 10 * SECOND,
    });
    return false;
  }

  indexes_in_range(indexes) {
    const fields = remindFields(this.context.user).filter(
      (remindField) => !remindField.remindData.idDeleted,
    );
    const impostors = indexes.filter(
      (number) => fields.length > number && -fields.length < number + 1,
    );
    if (indexes.length) {
      return true;
    }
    this.context.interaction.msg({
      description: `${impostors.join(", ")}, — не включены в диапазон [${-fields.length}, ${fields.length - 1}]`,
      color: "#ff0000",
      delete: 10 * SECOND,
    });
    return false;
  }

  onProcess() {
    const indexes = this.indexes(this.capture?.toString());
    if (!this.indexes_exists(indexes) || !this.indexes_in_range(indexes)) {
      return;
    }
  }
}

// MARK: Command
class Command extends BaseCommand {
  static EVENT_NAME = "remind";

  options = {
    name: "remind",
    id: 44,
    media: {
      description:
        "Создаёт напоминание, например, выключить суп, ну или что ещё вам напомнить надо :rolling_eyes:",
      example: `!remind {time} {text} #Время в формате 1ч 2д 18м`,
    },
    alias:
      "напомни напоминание напомнить нагадай нагадування нагадайко нап rem reminds",
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
    accessibility: {
      publicized_on_level: 5,
    },
    allowDM: true,
    cooldown: 8_000,
    cooldownTry: 5,
    type: "other",
  };

  async onCallback(context, interaction, pager) {
    this.process_trash_reaction(context, interaction, pager);
  }

  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }

  async process_reminds_interface(context) {
    const { interaction } = context;
    const reminds = remindFields(context.user).filter(
      (remindField) => !remindField.remindData.isDeleted,
    );

    const pager = new Pager(interaction.channel);
    pager.setHideDisabledComponents(true);
    pager.setUser(interaction.user);
    pager.setDefaultMessageState({
      fetchReply: true,
      title: "Вы не указали время, через какое нужно напомнить..",
      description: `Пример:\n!напомни 1 ч. 7 м. ${context.phrase || RemindData.DEFAULT_VALUES.phrase}\n\nАктивных напоминаний: ${reminds.length}`,
    });

    pager.emitter.on(Pager.Events.allowed_collect, async ({ interaction }) =>
      this.onCallback(context, interaction, pager),
    );
    pager.setPagesLength(reminds.length + 1);

    pager.setRender(() => {
      const reminds = remindFields(context.user).filter(
        (remindField) => !remindField.remindData.isDeleted,
      );
      pager.setPagesLength(reminds.length + 1);
      pager.setReactions(reminds.length ? ["🗑️"] : []);
      const remind = reminds[pager.currentPage];
      if (!remind) {
        return {};
      }
      return {
        title: `Напоминание, номер: ${pager.currentPage}`,
        description: `${RemindDataFormatter.toUserString(remind.remindData)}`,
      };
    });
    await pager.updateMessage();
    return;
  }

  async process_trash_reaction(context, interaction, pager) {
    if (interaction.customId !== "🗑️") {
      return;
    }

    const { channel, user } = context;
    const { reminds } = user.data;

    const { length } = reminds;

    const { content } = await question({
      channel,
      user,
      message: {
        title: `Для удаления, укажите индексы от ${-length} до ${length - 1} через пробел, чтобы удалить 🗑️ напоминания. Чтобы отменить, введите любое не числовое значение`,
      },
    });
    if (!content) {
      return;
    }
    await new DeleteRemind_FlagSubcommand(context, content).onProcess();
    if (!reminds.length) {
      pager.setReactions([]);
    }
  }

  async processCreateRemind(context) {
    const { channel } = context;
    const { values } = context.paramsProcessor;
    const { timeTo } = values;
    const remindData = new RemindData({ ...values, channelId: channel.id });

    if (
      !AbstractRemindRepeats.processLimites(remindData, context) ||
      !this.processRemindTimeLimit(remindData, timeTo, context)
    ) {
      return;
    }

    const { user } = context;

    const { timeEvent } = MemberRemindField.create(user, {
      remindData,
      timeTo,
    });

    const description = `— ${AbstractRemindRepeats.message.processMessageWithRepeat(remindData.phrase, remindData)}`;
    await channel.msg({
      title: "Напомнинание создано",
      description,
      timestamp: timeEvent.timestamp,
      footer: {
        iconURL: user.avatarURL(),
        text: user.username,
      },
    });
  }

  async processDeleteRemindFlag(context) {
    const { deleteRemind } = context.paramsProcessor.values;
    if (!deleteRemind) {
      return;
    }

    await new DeleteRemind_FlagSubcommand(context, deleteRemind).onProcess();
    return true;
  }

  processRemindTimeLimit(remindData, timeTo, context) {
    const { channel } = context;
    const { phrase } = remindData;
    const LIMIT = YEAR * 30;

    if (timeTo <= LIMIT) {
      return true;
    }
    channel.msg({
      color: "#ff0000",
      title: "Максимальный период — 30 лет",
      delete: 8_000,
      description: phrase,
    });
    return false;
  }

  async run(context) {
    const { timeTo } = context.paramsProcessor.values;

    if (await this.processDeleteRemindFlag(context)) {
      return;
    }

    timeTo
      ? await this.processCreateRemind(context)
      : this.process_reminds_interface(context);
    return context;
  }
}

export {
  AbstractRemindEvaluate as Remind_AbstractEvaluate,
  AbstractRemindRepeats as Remind_AbstractRepeats,
  MemberRemindField as Remind_MemberField,
  RemindData,
};

export default Command;
