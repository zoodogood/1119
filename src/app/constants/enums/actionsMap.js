const ActionsMap = {
  // Client
  messageCreate: "messageCreate",

  // User
  beforeProfileDisplay: "beforeProfileDisplay",
  beforeResourcePayed: "beforeResourcePayed",
  casinoSession: "casinoSession",
  coinFromMessage: "coinFromMessage",
  likedTheUser: "likedTheUser",
  buyFromGrempen: "buyFromGrempen",
  callBot: "callBot",
  berryBarter: "berryBarter",
  openChest: "openChest",
  chilliBooh: "chilliBooh",
  praiseUser: "praiseUser",
  userPraiseMe: "userPraiseMe",
  anonTaskResolve: "anonTaskResolve",
  beforeBagInteracted: "beforeBagInteracted",
  // Quest
  dailyQuestSkiped: "dailyQuestSkiped",
  dailyQuestComplete: "dailyQuestComplete",
  globalQuest: "globalQuest",
  dailyQuestInit: "dailyQuestInit",
  beforeDailyQuestInit: "beforeDailyQuestInit",
  // Boss
  bossAfterAttack: "bossAfterAttack",
  bossBeforeAttack: "bossBeforeAttack",
  bossMakeDamage: "bossMakeDamage",
  bossBeforeEffectInit: "bossBeforeEffectInit",
  bossEffectInit: "bossEffectInit",
  bossEffectTimeoutEnd: "bossEffectTimeoutEnd",
  bossEffectEnd: "bossEffectEnd",
  // Curse
  curseInit: "curseInit",
  curseEnd: "curseEnd",
  curseTimeEnd: "curseTimeEnd",
  curseBeforeSetProgress: "curseBeforeSetProgress",
  // Other
  resourceChange: "resourceChange",
  callCommand: "callCommand",
  inputCommandParsed: "inputCommandParsed",
  any: "_any",
};

export { ActionsMap };
