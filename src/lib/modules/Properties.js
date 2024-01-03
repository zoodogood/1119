import * as Util from "#lib/util.js";
import { GeneralPropertiesmap } from "#constants/enums/generalPropertiesMap.js";

const PropertiesList = {
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
    allias: "coins coin коин коинов коина коины монет монету монеты монета",
  },
  level: {},
  exp: {
    allias: "опыта опыт опытов exp experience",
  },
  berrys: {
    allias: "клубника клубник клубники berrys berry ягод ягода ягоды",
  },
  chestLevel: {},
  void: {
    allias:
      "void камень камня камней нестабильность камни нестабильности нест н",
  },
  keys: {
    label: "Ключ",
    labelMeta: {
      base: "ключ",
      suffixes: ["ей", "", "а"],
    },
    allias: "keys key ключ ключей ключа ключи k к",
  },
  chestBonus: {
    allias:
      "bonus chest бонус бонусов бонуса бонусы сундук сундука сундуки сундуков б с",
  },
  presents: {
    allias: "presents подарок подарка подарков present",
  },
  snowyTree: {
    allias: "snowy новогоднее",
  },
  lollipops: {
    allias: "lollipops lolipops lollipop lolipop леденец леденцы леденцов",
  },
  cheese: {
    allias: "сыр сыра сыров cheese cheeses",
  },
  voidRituals: {},
  voidCoins: {},
  questProgress: {},
  questNeed: {},
  questReward: {},
  questTime: {},
  last_online: {},
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
  thiefGloves: {
    allias: "перчатки перчатку перчатка перчаток glove gloves",
  },
  chilli: {
    allias: "chilli перец перца перцев перцы",
  },
  invites: {},
  iq: {},
  cursesEnded: {},
  voidCasino: {},
  element: {},
  coinsPerMessage: {},
  voidPrice: {},
  elementLevel: {},
  bag: {},
  effects: {},
  curses: {},
  seed: {
    allias: "seed семян семечек семечко семечка seeds",
  },
  voidTreeFarm: {},
  voidDouble: {},
  CD_$: {},
  leave_roles: {},
  profile_confidentiality: {},
  voidQuests: {},
  monster: {
    allias: "monster монстр монстра монстров монстры",
  },
  monstersBought: {},
  voidThief: {},
  thiefWins: {},
  quest: {},
  voidMysticClover: {},
  voidFreedomCurse: {},
  chestbonus: {},
  voidCooldown: {},
  remainedQuest: {},
  effectsCallbackMap: {},
  cursesCallbackMap: {},
};

class Properties {
  static endingOf(property, quantity) {
    const item = PropertiesList[property];
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

export { Properties, GeneralPropertiesmap as PropertiesEnum, PropertiesList };
export default Properties;
