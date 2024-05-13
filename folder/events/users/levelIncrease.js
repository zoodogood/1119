import { BaseEvent, EventsManager } from "#lib/modules/EventsManager.js";

import { LEVELINCREASE_EXPERIENCE_PER_LEVEL as EXPERIENCE_PER_LEVEL } from "#constants/users/events.js";
import { sleep } from "#lib/safe-utils.js";

class Event extends BaseEvent {
  constructor() {
    const EVENT = "users/levelIncrease";
    super(EventsManager.emitter, EVENT);
  }

  async onLevelIncrease(user, message) {
    const initialLevel = user.level;

    while (user.exp >= user.level * EXPERIENCE_PER_LEVEL) {
      const expSummary = user.level * EXPERIENCE_PER_LEVEL;
      const coefficient = Math.max(0.97716 ** user.voidRituals, 0.25);
      user.exp -= Math.ceil(expSummary * coefficient);
      user.level++;
    }

    (async (originalMessage) => {
      const author = originalMessage.author;

      const textContent =
        user.level - initialLevel > 2
          ? `**${author.username} повышает уровень с ${initialLevel} до ${user.level}!**`
          : `**${author.username} получает ${user.level} уровень!**`;

      const message = await originalMessage.msg({ content: textContent });

      if (
        !message.guild ||
        message.channel.id !== message.guild.data.chatChannel
      ) {
        await sleep(5000);
        message.delete();
      }
    })(message);
  }

  async run({ user, message }) {
    this.onLevelIncrease(user, message);
  }

  options = {
    name: "users/levelIncrease",
  };
}

export default Event;
