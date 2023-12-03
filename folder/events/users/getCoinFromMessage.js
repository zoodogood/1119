import { Actions } from "#lib/modules/ActionManager.js";
import DataManager from "#lib/modules/DataManager.js";
import { BaseEvent, EventsManager } from "#lib/modules/EventsManager.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import * as Util from "#lib/util.js";

class Event extends BaseEvent {
  constructor() {
    const EVENT = "users/getCoinsFromMessage";
    super(EventsManager.emitter, EVENT);
  }

  snowyEvent() {}

  calculateMultiplayer({ user, message }) {
    const userData = user.data;
    let k = 1;

    if (DataManager.data.bot.dayDate === "31.12") {
      k += 0.2;
    }

    if (message.guild && "cloverEffect" in message.guild.data) {
      const CLOVER_MIN_EFFECT = 0.08;
      const INCREASE_BY_CLOVER = 0.07;
      const WEAKING_FOR_CLOVER = 0.9242;
      const reduced =
        WEAKING_FOR_CLOVER ** message.guild.data.cloverEffect.uses /
        (1 - WEAKING_FOR_CLOVER);
      const value = CLOVER_MIN_EFFECT + INCREASE_BY_CLOVER * (1 - reduced);

      const multiplier = value * 2 ** (userData.voidMysticClover ?? 0);
      k += multiplier;
    }

    return k;
  }

  async onGetCoinsFromMessage({ user, message }) {
    const userData = user.data;
    user.action(Actions.coinFromMessage, {
      channel: message.channel,
    });

    let reaction = "637533074879414272";
    const k = this.calculateMultiplayer({ user, message });
    if (DataManager.data.bot.dayDate === "31.12") {
      reaction = "❄️";
    }

    if (message.guild && "cloverEffect" in message.guild.data) {
      reaction = "☘️";
      message.guild.data.cloverEffect.coins++;
    }

    const coins = Math.round((35 + (userData.coinsPerMessage ?? 0)) * k);
    Util.addResource({
      user,
      executor: user,
      value: coins,
      source: "eventsManager.event.users.getCoinsFromMessage",
      resource: PropertiesEnum.coins,
      context: { message },
    });
    Util.addResource({
      user,
      executor: user,
      value: 5,
      source: "eventsManager.event.users.getCoinsFromMessage",
      resource: PropertiesEnum.chestBonus,
      context: { message },
    });

    const react = await message.awaitReact(
      { user: message.author, removeType: "full", time: 20000 },
      reaction,
    );

    if (!react) {
      return;
    }

    const messageContent = `> У вас ${Util.ending(
      userData.coins,
      "коин",
      "ов",
      "",
      "а",
    )} <:coin:637533074879414272>!\n> Получено ${coins}\n> Бонус сундука: ${
      userData.chestBonus || 0
    }`;
    message.msg({ content: messageContent, delete: 3_000 });
  }

  async run({ user, message }) {
    this.onGetCoinsFromMessage({ user, message });
  }

  options = {
    name: "users/getCoinsFromMessage",
  };
}

export default Event;
