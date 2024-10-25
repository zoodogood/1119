import { BaseEvent, EventsManager } from "#lib/modules/EventsManager.js";

import { LEVELINCREASE_EXPERIENCE_PER_LEVEL as EXPERIENCE_PER_LEVEL } from "#constants/users/events.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import { sleep } from "#lib/safe-utils.js";
import { addResource } from "#lib/util.js";

class Event extends BaseEvent {
  options = {
    name: "users/levelIncrease",
  };

  constructor() {
    const EVENT = "users/levelIncrease";
    super(EventsManager.emitter, EVENT);
  }

  async onLevelIncrease(user, message) {
    const userData = user.data;
    const initialLevel = userData.level;

    while (userData.exp >= userData.level * EXPERIENCE_PER_LEVEL) {
      const expSummary = userData.level * EXPERIENCE_PER_LEVEL;
      const coefficient = Math.max(0.97716 ** userData.voidRituals, 0.625);
      const context = {
        coefficient,
        expSummary,
        user,
        message,
      };
      addResource({
        value: -Math.ceil(expSummary * coefficient),
        resource: PropertiesEnum.exp,
        user,
        context,
        executor: null,
        source: "events.users.levelIncrease",
      });
      addResource({
        value: 1,
        resource: PropertiesEnum.level,
        user,
        context,
        executor: null,
        source: "events.users.levelIncrease",
      });
    }

    (async (originalMessage) => {
      const author = originalMessage.author;

      const textContent =
        userData.level - initialLevel > 2
          ? `**${author.username} повышает уровень с ${initialLevel} до ${userData.level}!**`
          : `**${author.username} получает ${userData.level} уровень!**`;

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
}

export default Event;
