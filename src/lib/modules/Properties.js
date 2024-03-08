import * as Util from "#lib/util.js";
import { GeneralPropertiesMap } from "#constants/enums/generalPropertiesMap.js";

const PropertiesList = {
  berrysPrice: {},
  grempenBoughted: {},

  name: {},
  id: {},
  coins: {
    id: GeneralPropertiesMap.coins,
    label: "Коин",
    labelMeta: {
      base: "коин",
      suffixes: ["ов", "", "а"],
    },
    emojiKey: GeneralPropertiesMap.coins,
    alias:
      "coins coin коин коинов коина коины монет монету монеты монета монеток",
  },
  level: {},
  exp: {
    alias: "опыта опыт опытов exp experience",
  },
  berrys: {
    alias:
      "клубника клубник клубники клубничка клубничек клубнички berrys berry ягод ягода ягоды ягодок",
  },
  chestLevel: {},
  void: {
    alias:
      "void камушков камешек камушка voids камень камня камней нестабильность камни нестабильности нест н",
    emojiKey: GeneralPropertiesMap.void,
  },
  keys: {
    label: "Ключ",
    labelMeta: {
      base: "ключ",
      suffixes: ["ей", "", "а"],
    },
    alias: "keys key ключ ключей ключа ключи ключики ключик ключиков k к",
  },
  chestBonus: {
    alias:
      "bonus bonuses chest бонус бонусов бонуса бонусы сундук сундука сундуки сундуков б с",
  },
  presents: {
    alias: "presents подарок подарка подарков present",
    emojiKey: GeneralPropertiesMap.presents,
  },
  snowyTree: {
    alias: "snowy новогоднее",
  },
  lollipops: {
    alias: "lollipops lolipops lollipop lolipop леденец леденцы леденцов",
    emojiKey: GeneralPropertiesMap.lollipops,
  },
  cheese: {
    alias: "сыр сыра сыров cheese cheeses",
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
    alias: "перчатки перчатку перчатка перчаток glove gloves",
  },
  chilli: {
    alias: "chilli перец перца перцев перцы",
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
    alias: "seed семян семечек семечко семечка seeds",
  },
  voidTreeFarm: {},
  voidDouble: {},
  CD_$: {},
  leave_roles: {},
  profile_confidentiality: {},
  voidQuests: {},
  monster: {
    alias: "monster монстр монстра монстров монстры",
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

export { Properties, GeneralPropertiesMap as PropertiesEnum, PropertiesList };
export default Properties;
