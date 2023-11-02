import * as Util from "#lib/util.js";

const Schema = {
  Bot: {
    berrysPrice: 0,
    grempenItems: "",
  },
  Guild: {
    name: "",
    boss: {
      users: [
        {
          userStats: {},
        },
      ],
    },
  },
  User: {
    id: "",
    name: "",
    coins: 0,
    level: 0,
    exp: 0,
    berrys: 0,
    chestLevel: 0,
    void: 0,
    keys: 0,
    voidRituals: 0,
    voidCoins: 0,
    quest: {
      goal: 0,
      progress: 0,
    },
    questReward: {},
    questTime: {},
    last_online: 0,
    chestBonus: 0,
    praiseMe: [""],
    BDay: "",
    questsGlobalCompleted: {},
    grempenBoughted: 0,
    shopTime: {},
    first_$: true,
    praise: [""],
    profile_color: {},
    profile_description: {},
    questLast: {},
    dayQuests: {},
    thiefGloves: {},
    chilli: {},
    invites: {},
    iq: 0,
    cursesEnded: 0,
    voidCasino: {},
    element: {},
    coinsPerMessage: 0,
    voidPrice: {},
    elementLevel: 0,
    bag: {},
    curses: {},
    seed: 0,
    voidTreeFarm: {},
    voidDouble: {},
    CD_$: 0,
    leave_roles: {},
    profile_confidentiality: {},
    voidQuests: {},
    monster: {},
    monstersBought: {},
    voidThief: {},
    thiefWins: {},
    voidMysticClover: {},
    voidFreedomCurse: {},
    voidCooldown: {},
    remainedQuest: {},
    bossEffects: {},
    bossEffectsCallbackMap: {},
    cursesCallbackMap: {},
  },
  curseEntity: {},

  timeEventEntity: {},
  counterEntity: {},
};


const ProperiesEnum = {
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
    const item = ProperiesEnum[property];
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

export { Properties, ProperiesEnum, Schema };
export default Properties;
