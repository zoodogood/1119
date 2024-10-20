// @ts-check
import { client } from "#bot/client.js";
import { PermissionsBits } from "#constants/enums/discord/permissions.js";
import { DAY, SECOND } from "#constants/globals/time.js";
import { BaseCommand } from "#lib/BaseCommand.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { MessageInterface } from "#lib/DiscordMessageInterface.js";
import { fetchMessagesWhile } from "#lib/fetchMessagesWhile.js";
import * as Util from "#lib/util.js";
import { CliParser } from "@zoodogood/utils/primitives";
import { FormattingPatterns, PermissionFlagsBits } from "discord.js";

const RemoveStatus = {
  Idle: "Idle",
  Running: "Running",
  Ended: "Ended",
};
// MARK: Remover
class Remover {
  _interface = null;
  canceled = false;
  MAX_BULK_REMOVE_AVAILABLE = 50;
  removedCount = 0;
  removeStatus = RemoveStatus.Idle;
  constructor(context, fetchedMessages) {
    this.context = context;
    this.fetchedMessages = fetchedMessages;
  }

  cancel() {
    this.canceled = true;
  }

  createInterface() {
    const _interface = new MessageInterface();
    _interface.setChannel(this.context.channel);
    _interface.setRender(() => this.getEmbed());
    _interface.setReactions(["❌"]);

    _interface.updateMessage();
    this._interface = _interface;

    _interface.emitter.on(
      MessageInterface.Events.allowed_collect,
      ({ interaction }) => this.process_collectCallback(interaction),
    );
    return _interface;
  }
  getEmbed() {
    return {
      title: this.getEmbedTitle(),
      description: this.getEmbedDescription(),
    };
  }

  getEmbedDescription() {
    const isEnded = this.removeStatus === RemoveStatus.Ended;
    switch (true) {
      case this.canceled:
        return `Было очищено ${Util.ending(
          this.removedCount,
          "сообщени",
          "й",
          "е",
          "я",
        )} до отмены`;
      case isEnded:
        return null;
      default:
        return "Нажмите реакцию чтобы отменить чистку";
    }
  }

  getEmbedTitle() {
    const { removedCount, fetchedMessages, canceled, removeStatus } = this;

    switch (true) {
      case canceled:
        return "Очистка была отменена";
      case removeStatus === RemoveStatus.Ended:
        return `Удалено ${Util.ending(removedCount, "сообщени", "й", "е", "я")}!`;
      case !!removedCount:
        return `Пожалуйста, Подождите... ${removedCount} / ${fetchedMessages.length}`;
      default:
        return `Пожалуйста, Подождите... ${Util.ending(
          fetchedMessages.length,
          "сообщени",
          "й",
          "е",
          "я",
        )} на удаление.`;
    }
  }

  async onProcess() {
    this.createInterface();
    await Util.sleep(3000);

    if (this.fetchedMessages.length > 120) {
      this.context.channel.sendTyping();
    }

    await this.start_remove();
    this._interface.setDefaultMessageState({ delete: SECOND * 5 });
    this._interface.updateMessage();
    this._interface.close();

    new Logger(this.context, this).onProcess();
  }

  process_cancelCallback(interaction) {
    const canCancel =
      interaction.user === this.context.user ||
      (() =>
        interaction.guild.members
          .resolve(interaction.user)
          ?.permissions.has(PermissionFlagsBits.Administrator))();

    if (!canCancel) {
      return;
    }

    this.cancel();
  }

  process_collectCallback(interaction) {
    this.process_cancelCallback(interaction);
  }

  async removeMessages({ messages, channel, isBulk }) {
    const result = await (isBulk
      ? channel.bulkDelete(messages)
      : (async () => {
          for (const message of messages) {
            await message.delete();
          }
        })());

    this.removedCount += messages.length;
    return result;
  }

  resolveRemovableGroups() {
    const { fetchedMessages, context } = this;
    const byBulkDelete = [];
    const byOneDelete = [];
    const { twoWeekAgo_stamp } = context;
    const inDM = context.channel_isDMBased;

    fetchedMessages.forEach((message) => {
      const isMoreThanDiscordBulkDeletePeriod =
        message.createdTimestamp - twoWeekAgo_stamp < 0;
      if (inDM || isMoreThanDiscordBulkDeletePeriod) {
        byOneDelete.push(message);
        return;
      }

      byBulkDelete.push(message);
    });

    return [byBulkDelete, byOneDelete];
  }

  async start_remove() {
    this.removeStatus = RemoveStatus.Running;
    const { channel } = this.context;
    const [byBulkDelete, byOneDelete] = this.resolveRemovableGroups();
    while (byBulkDelete.length) {
      if (this.canceled) {
        break;
      }
      await this.removeMessages({
        messages: byBulkDelete.splice(0, this.MAX_BULK_REMOVE_AVAILABLE),
        channel,
        isBulk: true,
      });
      this._interface.updateMessage();
    }

    while (byOneDelete.length) {
      if (this.canceled) {
        break;
      }
      await this.removeMessages({
        messages: byOneDelete.splice(0, Util.random(5, 15)),
        channel,
        isBulk: false,
      });
      this._interface.updateMessage();
    }
    this.removeStatus = RemoveStatus.Ended;
  }
}

// MARK: Logger
class Logger {
  constructor(context, remover) {
    this.context = context;
    this.remover = remover;
  }

  getEmbedDescription() {
    const { messagesFetcher, user, channel } = this.context;
    const { targetUserId, hasSpecialTarget } = messagesFetcher;

    const modes = [
      {
        label: "до указаного сообщения",
        condition: hasSpecialTarget,
      },
      {
        label: `сообщения пользователя <@${targetUserId}>`,
        condition: !!targetUserId,
      },
      {
        label: "количественная выборка",
        condition: !hasSpecialTarget,
      },
    ];

    const contents = {
      label: "Тип чистки",
      mode: modes
        .filter(({ condition }) => condition)
        .map(({ label }) => label)
        .join(", "),
      channel: `В канале: ${channel.toString()}`,
      user: `Удалил: ${user.toString()}`,
      canceled: this.remover.canceled ? "\nЧистка была отменена" : "",
    };

    return `${contents.channel}\n${contents.user}\n${contents.label}: ${Util.capitalize(contents.mode)}${contents.canceled}`;
  }

  getEmbedTitle() {
    return `Удалено ${Util.ending(this.remover.removedCount, "сообщени", "й", "е", "я")}`;
  }

  onProcess() {
    if (!this.process_guild_is_exists) {
      return false;
    }

    this.sendLog();
  }

  process_guild_is_exists() {
    if (!this.context.guild) {
      return false;
    }
    return true;
  }

  sendLog() {
    const { guild } = this.context;

    guild.logSend({
      title: this.getEmbedTitle(),
      description: this.getEmbedDescription(),
    });
  }
}

// MARK: Fetcher
class Fetcher {
  fetchedMessages = [];
  hasSpecialTarget = null;
  isLimit = false;
  isTargetFounded = false;
  limitCount = null;
  processedMessagesCount = 0;
  targetPhrase = null;

  targetReference = null;
  targetUserId;
  constructor(context) {
    this.context = context;
  }

  async fetch() {
    const { channel } = this.context;
    for await (const message of fetchMessagesWhile({
      channel,
    })) {
      this.processedMessagesCount++;
      if (this.processMessageIsSpecialFetched(message)) {
        break;
      }
      if (this.processMessagesLimit()) {
        break;
      }
      if (!this.processFetchedMessage_isAllowed(message)) {
        continue;
      }
      this.fetchedMessages.push(message);
    }
  }
  processFetchedMessage_isAllowed(message) {
    const { context } = this;
    const filterByUser =
      !this.targetUserId || message.author.id === this.targetUserId;
    const isUserInDMCHannel =
      context.channel_isDMBased && message.author.id !== client.user.id;

    return !message.pinned && !isUserInDMCHannel && filterByUser;
  }

  processMessageIsSpecialFetched(message) {
    if (!this.hasSpecialTarget) {
      return false;
    }
    const targetFounded =
      message.content === this.targetPhrase ||
      message.id === this.targetReference;

    targetFounded && (this.isTargetFounded = true);
    return targetFounded;
  }

  processMessagesLimit() {
    const isLimit = this.fetchedMessages.length >= this.limitCount;
    isLimit && (this.isLimit = true);
    return isLimit;
  }

  setOptions({
    targetPhrase,
    targetReference,
    targetUserId,
    hasSpecialTarget,
    limitCount,
  }) {
    Object.assign(this, {
      targetPhrase,
      targetReference,
      targetUserId,
      hasSpecialTarget,
      limitCount,
    });
  }
}

// MARK: CommandRunContext
class CommandRunContext extends BaseCommandRunContext {
  channel_isDMBased;
  CLEAN_COUNT_LIMIT = 1_000;
  DEFAULT_CLEAN_COUNT = 75;
  DEFAULT_CLEAN_FOUND_FOR_SPECIAL_TARGET = 500;
  messagesFetcher;
  referenceId;

  static async new(interaction, command) {
    const context = new this(interaction, command);
    context.referenceId = context.fetchReferenseId();
    context.channel_isDMBased = interaction.channel.isDMBased();
    context.messagesFetcher = new Fetcher(context);
    return context;
  }
  calculateMessagesForClean_count() {
    const {
      DEFAULT_CLEAN_COUNT,
      CLEAN_COUNT_LIMIT,
      DEFAULT_CLEAN_FOUND_FOR_SPECIAL_TARGET,
    } = this;
    const values = this.cliParsed.at(1);
    const [capturedCount] = values.get("clean_count") ?? [];

    const count =
      capturedCount ||
      (this.hasSpecialTarget()
        ? DEFAULT_CLEAN_FOUND_FOR_SPECIAL_TARGET
        : DEFAULT_CLEAN_COUNT);
    return Math.min(count, CLEAN_COUNT_LIMIT);
  }

  async fetchMessagesToClean() {
    const values = this.cliParsed.at(1);
    this.messagesFetcher.setOptions({
      targetPhrase: values.get("by_phrase")?.trim() || null,
      targetReference: this.referenceId,
      targetUserId: values.get("target_user")?.groups.id,
      hasSpecialTarget: this.hasSpecialTarget(),
      limitCount: this.calculateMessagesForClean_count(),
    });
    await this.messagesFetcher.fetch();
  }
  fetchReferenseId() {
    const { message } = this.interaction;
    const { reference } = message;
    return reference?.messageId;
  }
  hasSpecialTarget() {
    const values = this.cliParsed.at(1);
    return values.get("by_phrase").trim() || this.referenceId;
  }

  parseCli(input) {
    const parsed = new CliParser()
      .setText(input)
      .captureByMatch({
        regex: new RegExp(`${FormattingPatterns.User.source}`),
        name: "target_user",
      })
      .captureByMatch({ regex: /\d{1,16}/, name: "clean_count" })
      .captureResidue({ name: "by_phrase" })
      .collect();
    const values = parsed.resolveValues((capture) => capture?.content);
    this.setCliParsed(parsed, values);
  }

  get twoWeekAgo_stamp() {
    return Date.now() - DAY * 14;
  }
}

// MARK: Command
class Command extends BaseCommand {
  options = {
    name: "clear",
    id: 8,
    media: {
      description:
        '**Чистит сообщения в канале и имеет четыре режима:**\n1. Количесвенная чистка — удаляет указанное число.\n2. "Удалить до" — чистит всё до сообщения с указанным содержимым.\n3. Сообщения пользователя — стирает только сообщения отправленные указанным пользователем.\n4. Если не указать аргументов, будет удалено 75 последних сообщений.',
      example:
        "!clear <memb | count | messageContent> #messageContent — содержимое сообщения до которого провести чистку, не учитывает эмбеды и форматирование текста*",
      poster:
        "https://media.discordapp.net/attachments/769566192846635010/872526568965177385/clear.gif",
    },
    alias: "очистить очисти очисть клир клиар клір очистити",
    allowDM: true,
    cooldown: SECOND * 10,
    type: "guild",
    myChannelPermissions: PermissionsBits.ManageMessages,
    userChannelPermissions: PermissionsBits.ManageMessages,
  };
  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }

  processFetchedNessagesIsEmpty(context) {
    const { messagesFetcher } = context;
    const { fetchedMessages } = messagesFetcher;
    if (fetchedMessages.length !== 0) {
      return false;
    }
    const { channel } = context;
    channel.msg({
      title: "Вроде-как удалено 0 сообщений",
      delete: 7_000,
      description: "Я серьёзно! Не удалено ни единого сообщения!",
    });
    return true;
  }

  processIsSpecialTargetNotFound(context) {
    if (!context.hasSpecialTarget() || !context.messagesFetcher.isLimit) {
      return false;
    }
    const { channel, interaction } = context;
    const { params } = interaction;
    channel.msg({
      title: "Не удалось найти сообщение",
      color: "#ff0000",
      delete: 7_000,
      description: params,
    });
    return true;
  }

  removeCallMessage(context) {
    return context.interaction.message.delete().catch(() => {});
  }

  async run(context) {
    await this.removeCallMessage(context);
    context.parseCli(context.interaction.params);
    await context.fetchMessagesToClean();
    this.runClean(context);
  }

  async runClean(context) {
    const { messagesFetcher } = context;
    const { fetchedMessages } = messagesFetcher;

    if (this.processIsSpecialTargetNotFound(context)) {
      return;
    }

    if (this.processFetchedNessagesIsEmpty(context)) {
      return;
    }

    const remover = new Remover(context, fetchedMessages);
    await remover.onProcess();
  }
}

export default Command;
