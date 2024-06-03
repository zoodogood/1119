import { whenClientIsReady } from "#bot/util.js";
import {
  Remind_AbstractEvaluate,
  Remind_AbstractRepeats,
  Remind_MemberField,
} from "#folder/commands/remind.js";

class Event {
  options = {
    name: "TimeEvent/remind",
  };
  createMessage(context) {
    const { remindData, target, timeEvent } = context;
    const { processMessageWithRepeat } = Remind_AbstractRepeats.message;
    const { isLost } = timeEvent;
    const { phrase, evaluateRemind } = remindData;
    const description = processMessageWithRepeat(phrase, remindData);

    return target.msg({
      title: `Напоминание: ${evaluateRemind ? " --EVAL" : ""}`,
      description,
      footer: isLost
        ? {
            text: "Ваше напоминание не могло быть доставлено вовремя. Если напоминания должны были повторяться - этого не произойдет. Смещены данные об периодичности их повторений",
          }
        : null,
    });
  }

  process_status_is_null(context) {
    const { status } = context;
    if (status !== null) {
      return true;
    }

    context.user.msg({
      title: "На это время вызвано напоминание",
      description: "Текст напоминания утерян",
    });
    return false;
  }

  processSpecifyUser(context) {
    const { user, target } = context;
    if (target !== user) {
      target.msg({ content: user.toString(), mentions: [user.id] });
    }
  }

  processUserHaventPermissionsToSend(context) {
    const { user, target, channel } = context;
    if (target.recipientId === user.id) {
      return;
    }
    const member = channel.guild?.members.cache.get(user.id);
    const cannotSend =
      member &&
      (member.wastedPermissions(2048n, channel) ||
        member.isCommunicationDisabled());

    if (!member || cannotSend) {
      context.target = user;
      return;
    }
  }

  resolveParams(eventData) {
    const remindField = Remind_MemberField.fromTimeEvent(eventData) || {
      status: null,
    };
    const { remindData, user } = remindField;
    const { channel } = remindData;
    const target = channel || user;
    return {
      target,
      remindField,
      channel,
      ...(remindData || {}),
      ...remindField,
    };
  }

  // eslint-disable-next-line no-unused-vars
  async run(eventData, _userId) {
    await whenClientIsReady();
    const context = this.resolveParams(eventData);
    const { isLost } = eventData;

    const { remindField, isDeleted } = context;
    if (isDeleted) {
      return;
    }

    this.processUserHaventPermissionsToSend(context);
    this.processSpecifyUser(context);

    if (!this.process_status_is_null(context)) {
      return;
    }

    context.message = await this.createMessage(context);
    Remind_AbstractEvaluate.onTimeEvent(context);
    remindField.selfRemove();

    if (isLost) {
      return;
    }
    Remind_AbstractRepeats.process_recreate(eventData, remindField);
  }
}

export default Event;
