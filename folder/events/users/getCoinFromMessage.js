import { NEW_YEAR_DAY_DATE } from "#constants/globals/time.js";
import { Actions } from "#lib/modules/ActionManager.js";
import CurseManager from "#lib/modules/CurseManager.js";
import DataManager from "#lib/modules/DataManager.js";
import { BaseEvent, EventsManager } from "#lib/modules/EventsManager.js";
import { PropertiesEnum } from "#lib/modules/Properties.js";
import * as Util from "#lib/util.js";

class Event extends BaseEvent {
  constructor() {
    const EVENT = "users/getCoinsFromMessage";
    super(EventsManager.emitter, EVENT);
  }

  async snowyEvent({ user, message }) {
    if (DataManager.data.bot.dayDate !== NEW_YEAR_DAY_DATE) {
      return;
    }
    const PHRASES = [
      () => "Эта музыка не спешит заканчиваться",
      () => "Хо-хо-хо",
      () => "Отправляйте сообщения, чтобы получить проклятие зимнего праздника",
    ];
    const { guild } = message;
    guild.data.snowyEvent ||= { preGlowExplorers: [] };

    const { snowyEvent } = guild.data;
    if (snowyEvent.preGlowExplorers.length < PHRASES.length) {
      if (snowyEvent.preGlowExplorers.includes(user.id)) {
        return;
      }
      message.react("🌲");
      snowyEvent.preGlowExplorers.push(user.id);
      await Util.sleep(2_500);
      message.msg({
        reference: message.id,
        content: PHRASES.at(snowyEvent.preGlowExplorers.length - 1)(),
      });
      return;
    }

    const userData = user.data;
    if (userData.curses?.some((curse) => curse.id === "happySnowy")) {
      return;
    }

    message.react("🌲");
    const curseBase = CurseManager.cursesBase.get("happySnowy");
    const curse = CurseManager.generateOfBase({
      curseBase,
      user,
      context: { message, guild },
    });
    CurseManager.init({ curse, user });
    return;
  }

  calculateMultiplayer({ user, message }) {
    const { guild } = message;
    const userData = user.data;
    let k = 1;

    if (DataManager.data.bot.dayDate === NEW_YEAR_DAY_DATE) {
      k += 0.2;
    }

    if (guild && "cloverEffect" in guild.data) {
      const CLOVER_MIN_EFFECT = 0.08;
      const INCREASE_BY_CLOVER = 0.07;
      const WEAKING_FOR_CLOVER = 0.9242;
      const reduce = 1 - WEAKING_FOR_CLOVER ** guild.data.cloverEffect.uses;
      const value =
        CLOVER_MIN_EFFECT +
        (INCREASE_BY_CLOVER * reduce) / (1 - WEAKING_FOR_CLOVER);

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
    if (DataManager.data.bot.dayDate === NEW_YEAR_DAY_DATE) {
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
    this.snowyEvent({ user, message });
  }

  options = {
    name: "users/getCoinsFromMessage",
  };
}

export default Event;
