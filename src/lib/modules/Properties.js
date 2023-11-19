import * as Util from "#lib/util.js";
import { GeneralPropertiesmap } from "#constants/GeneralPropertiesMap.js";

const ProperiesList = {
  berrysPrice: {},
  grempen: {},

  name: {},
  id: {},
  coins: {
    label: "Коин",
    labelMeta: {
      base: "коин",
      suffixes: ["ов", "", "а"],
    },
  },
  level: {},
  exp: {},
  berrys: {},
  chestLevel: {},
  void: {},
  keys: {
    label: "Ключ",
    labelMeta: {
      base: "ключ",
      suffixes: ["ей", "", "а"],
    },
  },
  voidRituals: {},
  voidCoins: {},
  questProgress: {},
  questNeed: {},
  questReward: {},
  questTime: {},
  last_online: {},
  chestBonus: {},
  praiseMe: {},
  BDay: {},
  questsGlobalCompleted: {},
  shopTime: {},
  first_$: {},
  praise: {},
  profile_color: {},
  profile_description: {},
  questLast: {},
  dayQuests: {},
  thiefGloves: {},
  chilli: {},
  invites: {},
  iq: {},
  cursesEnded: {},
  voidCasino: {},
  element: {},
  coinsPerMessage: {},
  voidPrice: {},
  elementLevel: {},
  bag: {},
  curses: {},
  seed: {},
  voidTreeFarm: {},
  voidDouble: {},
  CD_$: {},
  leave_roles: {},
  profile_confidentiality: {},
  voidQuests: {},
  monster: 0,
  monstersBought: 0,
  voidThief: {},
  thiefWins: {},
  quest: {},
  voidMysticClover: {},
  voidFreedomCurse: {},
  chestbonus: {},
  voidCooldown: {},
  remainedQuest: {},
  bossEffects: {},
  bossEffectsCallbackMap: {},
  cursesCallbackMap: {},
};

class Properties {
  static endingOf(property, quantity) {
    const item = ProperiesList[property];
    if (!item) {
      return undefined;
    }

    const { labelMeta } = item;
    if (!labelMeta) {
      return `${quantity} ${item.label}`;
    }

    return Util.ending(quantity, labelMeta.base, ...labelMeta.suffixes, {
      unite: (_, word) => word,
    });
  }

  static emojiOf(propertyBase) {
    return propertyBase.emoji;
  }
}

export { Properties, GeneralPropertiesmap as PropertiesEnum, ProperiesList };
export default Properties;
