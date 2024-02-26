import { client } from "#bot/client.js";
import { whenClientIsReady } from "#bot/util.js";
import { AbstractRemindRepeats } from "#folder/commands/remind.js";

class Event {
  async run(eventData, authorId, channelId, phrase, repeatsCount) {
    await whenClientIsReady();
    const { isLost } = eventData;

    const channel = client.channels.cache.get(channelId);
    const user = client.users.cache.get(authorId);

    const target = channel || user;

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
      phrase,
      repeatsCount,
    );
  }

  options = {
    name: "TimeEvent/remind",
  };
}

export default Event;
