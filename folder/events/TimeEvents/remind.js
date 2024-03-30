import { whenClientIsReady } from "#bot/util.js";
import {
  RemindData,
  Remind_AbstractEvaluate,
  Remind_AbstractRepeats,
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
    const { isLost } = eventData;

    const context = this.resolveParams(eventData, params);
    const { remindData } = context;
    const { phrase, evaluateRemind } = remindData;

    this.processUserHaventPermissionsToSend(context);
    this.processSpecifyUser(context);

    const { target } = context;

    const { processMessageWithRepeat } = Remind_AbstractRepeats.message;
    const description = processMessageWithRepeat(phrase, remindData);

    context.message = await target.msg({
      title: `Напоминание: ${evaluateRemind ? " --EVAL" : ""}`,
      description,
      footer: isLost
        ? {
            text: "Ваше напоминание не могло быть доставлено вовремя. Если напоминания должны были повторяться - этого не произойдет. Смещены данные об периодичности их повторений",
          }
        : null,
    });

    Remind_AbstractEvaluate.onEvaluate(context);

    if (isLost) {
      return;
    }

    Remind_AbstractRepeats.processRemindTimeEvent(eventData, remindData);
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
