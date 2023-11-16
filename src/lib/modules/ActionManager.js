import { User as DiscordUser } from "discord.js";
import { CurseManager, QuestManager, ErrorsHandler } from "#lib/modules/mod.js";
import { BossEffects } from "#lib/modules/BossManager.js";

const ActionsMap = {
  // Client
  messageCreate: "messageCreate",

  // User
  beforeProfileDisplay: "beforeProfileDisplay",
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

class ActionManager {
  static Actions = ActionsMap;

  static extendsGlobalPrototypes() {
    const ActionManager = this;

    Object.defineProperty(DiscordUser.prototype, "action", {
      enumerable: false,
      value: function (actionName, data) {
        const userData = this.data;

        if (QuestManager.isNeedInstallDailyQuest({ user: this })) {
          if (!this.data.quest?.willUpdate) {
            QuestManager.requestInstallDailyQuest({ user: this });
          }
        }

        if (actionName === "globalQuest") {
          const questId = data.name;
          const questBase = QuestManager.questsBase.get(questId);
          QuestManager.onAction({ user: this, questBase, data });
        }

        if (
          QuestManager.questsBase.get(userData.quest.id).handler === actionName
        ) {
          const questId = userData.quest.id;
          const questBase = QuestManager.questsBase.get(questId);
          QuestManager.onAction({ user: this, questBase, data });
        }

        if (actionName in (userData.bossEffectsCallbackMap ?? {}))
          for (const effect of [...userData.bossEffects]) {
            if (data.guild && effect.guildId !== data.guild.id) {
              continue;
            }

            const effectBase = BossEffects.effectBases.get(effect.id);
            try {
              if (actionName in effectBase.callback)
                effectBase.callback[actionName].call(null, this, effect, data);
            } catch (error) {
              ErrorsHandler.Audit.push(error, {
                actionName,
                source: "BossEffectAction",
                effectId: effect.id,
              });
            }
          }

        /** Curse */
        if (actionName in (userData.cursesCallbackMap ?? {}))
          for (const curse of [...userData.curses]) {
            const curseBase = CurseManager.cursesBase.get(curse.id);
            try {
              if (actionName in curseBase.callback)
                curseBase.callback[actionName].call(null, this, curse, data);
            } catch (error) {
              ErrorsHandler.Audit.push(error, {
                actionName,
                source: "CurseAction",
                curseId: curse.id,
              });
            }
          }

        /** generalize */
        if (actionName !== ActionManager.Actions.any) {
          this.action(ActionManager.Actions.any, { actionName, data });
        }
      },
    });
  }
}

export default ActionManager;
export { ActionsMap as Actions };
