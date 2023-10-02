import * as Util from "#lib/util.js";

const ProperiesEnum = {
  "Bot": {
    berrysPrice: {},
    grempen: {}
  },
  "Guild": {
    name: {}
  },
  "boss": {

  },
  "userStats": {

  },
  "User": {
    id: {},
    name: {},
    coins: {},
    level: {},
    exp: {},
    berrys: {},
    chestLevel: {},
    void: {},
    keys: {},
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
    completedQuest: {},
    grempen: {},
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
    monster: {},
    monstersBought: {},
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
  },
  "curseEntity": {

  },
	
	
  "timeEventEntity": {

  },
  "counterEntity": {

  },
	
};

class Properties {
  static endingOf(propertyBase, quantity){
    const item = propertyBase;
    if (!item){
      return undefined;
    }

    // delevop crutch
    return "void";

    return Util.ending(quantity, item.base, ...item.suffixes, {unite: (_, word) => word});
  }

  static emojiOf(propertyBase){
    return propertyBase.emoji;
  }
}

export {Properties, ProperiesEnum};
export default Properties;