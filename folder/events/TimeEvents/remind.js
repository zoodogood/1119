import { whenClientIsReady } from "#bot/util.js";
import {
  RemindData,
  Remind_AbstractEvaluate,
  Remind_AbstractRepeats,
  RemindsManager,
} from "#folder/commands/remind.js";

class Event {
  resolveParams(eventData, params) {
    const remindData = RemindData.fromParams(params);
    const { channel, user } = remindData;
    const target = channel || user;
    return {
      target,
      eventData,
      remindData,
      ...remindData,
    };
  }
  async run(eventData, ...params) {
    await whenClientIsReady();
    const context = this.resolveParams(eventData, params);
    const { isLost } = eventData;
    const { remindData } = context;

    this.processUserHaventPermissionsToSend(context);
    this.processSpecifyUser(context);

    const { user } = context;
    context.message = await this.createMessage(context);
    Remind_AbstractEvaluate.onEvaluate(context);
    RemindsManager.removeRemind(eventData.timestamp, user.data.reminds);

    if (isLost) {
      return;
    }
    Remind_AbstractRepeats.processRemindTimeEvent(eventData, remindData);
  }

  createMessage(context) {
    const { remindData, target, eventData } = context;
    const { processMessageWithRepeat } = Remind_AbstractRepeats.message;
    const { isLost } = eventData;
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

  processSpecifyUser(context) {
    const { user, target } = context;
    if (target !== user) {
      target.msg({ content: user.toString(), mentions: [user.id] });
    }
  }

  options = {
    name: "TimeEvent/remind",
  };
}

export default Event;
