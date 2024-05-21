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
  beforeBerryBarter: "beforeBerryBarter",
  berryBarter: "berryBarter",
  beforeOpenChest: "beforeOpenChest",
  openChest: "openChest",
  chilliBooh: "chilliBooh",
  praiseUser: "praiseUser",
  userPraiseMe: "userPraiseMe",
  anonTaskResolve: "anonTaskResolve",
  beforeBagInteracted: "beforeBagInteracted",
  bagItemMove: "bagItemMove",
  thing: "thing",
  beforeBankInteracted: "beforeBankInteracted",
  // Quest
  dailyQuestSkiped: "dailyQuestSkiped",
  dailyQuestComplete: "dailyQuestComplete",
  globalQuest: "globalQuest",
  dailyQuestInit: "dailyQuestInit",
  beforeDailyQuestInit: "beforeDailyQuestInit",
  // Effects
  beforeEffectInit: "beforeEffectInit",
  effectInit: "effectInit",
  effectRemove: "effectRemove",
  effectTimeEnd: "effectTimeEnd",
  // Boss
  bossAfterAttack: "bossAfterAttack",
  bossBeforeAttack: "bossBeforeAttack",
  bossMakeDamage: "bossMakeDamage",
  bossBeforeEffectInit: "bossBeforeEffectInit",
  bossBeforeAttackCooldownUpdated: "bossBeforeAttackCooldownUpdated",
  bossBeforeAttackDamageMultiplayerUpdated:
    "bossBeforeAttackDamageMultiplayerUpdated",
  bossEffectInit: "bossEffectInit",
  bossEffectEnd: "bossEffectEnd",
  // Curse
  curseInit: "curseInit",
  curseEnd: "curseEnd",
  curseTimeEnd: "curseTimeEnd",
  curseBeforeSetProgress: "curseBeforeSetProgress",
  // TimeEventsManager
  timeEventCurseTimeoutEnd: "timeEventCurseTimeoutEnd",
  timeEventEffectTimeoutEnd: "timeEventEffectTimeoutEnd",
  // Other
  resourceChange: "resourceChange",
  callCommand: "callCommand",
  inputCommandParsed: "inputCommandParsed",
  tunnelMessageReceive: "tunnelMessageReceive",
  any: "_any",
};

export { ActionsMap };
