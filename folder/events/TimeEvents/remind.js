import { client } from "#bot/client.js";
import { whenClientIsReady } from "#bot/util.js";
import { RemindData, Remind_AbstractRepeats } from "#folder/commands/remind.js";
import { capitalize } from "#lib/mini.js";

class Event {
  resolveParams(authorId, channelId, phrase, repeatsCount) {
    phrase = capitalize(phrase || RemindData.DEFAULT_VALUES.phrase);

    const channel = client.channels.cache.get(channelId);
    const user = client.users.cache.get(authorId);
    const target = channel || user;
    return {
      phrase,
      repeatsCount,
      channel,
      user,
      target,
      isDefaultPhrase: phrase === RemindData.DEFAULT_VALUES.phrase,
    };
  }
  async run(eventData, ...params) {
    await whenClientIsReady();
    const { isLost } = eventData;

    const context = this.resolveParams(...params);

    const { phrase, repeatsCount, user, channel, isDefaultPhrase } = context;

    this.processUserHaventPermissionsToSend(context);
    this.processSpecifyUser(context);

    const { target } = context;

    const { processMessageWithRepeat } = Remind_AbstractRepeats.message;
    const description = processMessageWithRepeat(phrase, context, true);

    target.msg({
      title: "Напоминание:",
      description,
      footer: isLost
        ? {
            text: "Ваше напоминание не могло быть доставлено вовремя. Если напоминания должны были повторяться - этого не произойдет. Смещены данные об периодичности их повторений",
          }
        : null,
    });

    if (isLost) {
      return;
    }

    Remind_AbstractRepeats.processRemindTimeEvent(
      eventData,
      channel,
      user,
      !isDefaultPhrase && phrase,
      repeatsCount,
    );
  }

  processUserHaventPermissionsToSend(context) {
    const { user, target, channel } = context;
    if (target === user) {
      return;
    }

    const member = channel.guild.members.cache.get(user.id);
    const cannotSend =
      (member && member.wastedPermissions(2048n, channel)) ||
      member.isCommunicationDisabled();

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
