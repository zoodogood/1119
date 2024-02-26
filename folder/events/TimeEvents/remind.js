import { client } from "#bot/client.js";
import { whenClientIsReady } from "#bot/util.js";
import { AbstractRemindRepeats, RemindData } from "#folder/commands/remind.js";
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

    const { phrase, repeatsCount, user, channel, target, isDefaultPhrase } =
      this.resolveParams(...params);

    if (target !== user)
      target.msg({ content: user.toString(), mentions: [user.id] });

    target.msg({
      title: "Напоминание:",
      description: phrase,
      footer: isLost
        ? {
            text: "Ваше напоминание не могло быть доставлено вовремя. Если напоминания должны были повторяться - этого не произойдет. Смещены данные об периодичности их повторений",
          }
        : null,
    });

    if (isLost) {
      return;
    }

    AbstractRemindRepeats.processRemindTimeEvent(
      eventData,
      channel,
      user,
      !isDefaultPhrase && phrase,
      repeatsCount,
    );
  }

  options = {
    name: "TimeEvent/remind",
  };
}

export default Event;
