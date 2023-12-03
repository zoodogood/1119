import { Actions } from "#lib/modules/ActionManager.js";
import DataManager from "#lib/modules/DataManager.js";
import { BaseEvent, EventsManager } from "#lib/modules/EventsManager.js";
import * as Util from "#lib/util.js";

class Event extends BaseEvent {
  constructor() {
    const EVENT = "users/getCoinsFromMessage";
    super(EventsManager.emitter, EVENT);
  }

  snowyEvent() {}

  calculateMultiplayer({ userData, message }) {
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

  async onGetCoinsFromMessage({ userData, message }) {
    message.author.action(Actions.coinFromMessage, {
      channel: message.channel,
    });

    let reaction = "637533074879414272";
    const k = this.calculateMultiplayer({ userData, message });
    if (DataManager.data.bot.dayDate === "31.12") {
      reaction = "❄️";
    }

    if (message.guild && "cloverEffect" in message.guild.data) {
      reaction = "☘️";
      message.guild.data.cloverEffect.coins++;
    }

    const coins = Math.round((35 + (userData.coinsPerMessage ?? 0)) * k);
    userData.coins += coins;
    userData.chestBonus = (userData.chestBonus ?? 0) + 5;

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

  async run({ userData, message }) {
    this.onGetCoinsFromMessage({ userData, message });
  }

  options = {
    name: "users/getCoinsFromMessage",
  };
}

export default Event;
