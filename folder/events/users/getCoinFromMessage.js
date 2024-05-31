import { CALCULATE_CLOVER_MULTIPLAYER } from "#constants/users/commands.js";
import { Actions } from "#lib/modules/ActionManager.js";
import { BaseEvent, EventsManager } from "#lib/modules/EventsManager.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import * as SnowyEvent from "#lib/snowyEvent.js";
import * as Util from "#lib/util.js";

export function addCoinFromMessage(message) {
  EventsManager.emitter.emit("users/getCoinsFromMessage", {
    user: message.author,
    message,
  });
}
class Event extends BaseEvent {
  options = {
    name: "users/getCoinsFromMessage",
  };

  constructor() {
    const EVENT = "users/getCoinsFromMessage";
    super(EventsManager.emitter, EVENT);
  }

  calculateMultiplayer({ user, message }) {
    const { guild } = message;
    const userData = user.data;
    let k = 1;

    if (SnowyEvent.checkAvailableIn(guild)) {
      k += 0.2;
    }

    if (guild && "cloverEffect" in guild.data) {
      const value = CALCULATE_CLOVER_MULTIPLAYER(guild.data.cloverEffect.uses);
      const multiplayer = value * 1.12 ** (userData.voidMysticClover ?? 0);
      k += multiplayer;
    }

    return k;
  }

  async onGetCoinsFromMessage({ user, message }) {
    const userData = user.data;
    const { guild } = message;
    user.action(Actions.coinFromMessage, {
      channel: message.channel,
    });

    let reaction = "637533074879414272";
    const k = this.calculateMultiplayer({ user, message });
    if (SnowyEvent.checkAvailableIn(guild)) {
      reaction = "❄️";
    }

    if (guild && "cloverEffect" in guild.data) {
      reaction = "☘️";
      guild.data.cloverEffect.coins++;
    }

    const coins = Math.round((35 + (userData.coinsPerMessage ?? 0)) * k);
    Util.addResource({
      user,
      executor: user,
      value: coins,
      source: "eventsManager.event.users.getCoinsFromMessage",
      resource: PropertiesEnum.coins,
      context: { message, guild },
    });
    Util.addResource({
      user,
      executor: user,
      value: 5,
      source: "eventsManager.event.users.getCoinsFromMessage",
      resource: PropertiesEnum.chestBonus,
      context: { message, guild },
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
    SnowyEvent.onGetCoinsFromMessage({ user, message });
  }
}

export default Event;
