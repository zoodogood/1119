
import Discord from 'discord.js';
import { CurseManager, QuestManager, BossManager } from '#src/modules/mod.js';

const ActionsMap = {
	// Client
	messageCreate: "messageCreate",

	coinFromMessage: "coinFromMessage",
	likedTheUser: "likedTheUser",
	buyFromGrempen: "buyFromGrempen",
	callBot: "callBot",
	berryBarter: "berryBarter",
	openChest: "openChest",
	chilliBooh: "chilliBooh",
	praiseUser: "praiseUser",
	userPraiseMe: "userPraiseMe",
	// Quest
	dailyQuestSkiped: "dailyQuestSkiped",
	dailyQuestComplete: "dailyQuestComplete",
	globalQuest: "globalQuest",
	// Boss
	bossBeforeAttack: "bossBeforeAttack",
	bossMakeDamage: "bossMakeDamage",
	bossEffectInit: "bossEffectInit",
	bossEffectTimeoutEnd: "bossEffectTimeoutEnd",
	// Curse
	curseInit: "curseInit",
	curseTimeEnd: "curseTimeEnd",
	// Other
	callCommand: "callCommand",
	any: "_any"
}


class ActionManager {
	static Actions = ActionsMap;

	static extendsGlobalPrototypes(){
		const ActionManager = this;

		Object.defineProperty(Discord.User.prototype, "action", {
			value: function(actionName, data){
				const userData = this.data;


				if (actionName === "globalQuest"){
					const questId = data.name;
					const questBase = QuestManager.questsBase.get(questId);
					QuestManager.onAction({user: this, questBase, data});
				}

				if (userData.quest && QuestManager.questsBase.get(userData.quest.id).handler === actionName){
					const questId = userData.quest.id;
					const questBase = QuestManager.questsBase.get(questId);
					QuestManager.onAction({user: this, questBase, data});
				}

				if (actionName in (userData.bossEffectsCallbackMap ?? {}) && data.guild)
				for (const effect of [...userData.bossEffects]){
					if (effect.guildId !== data.guild.id){
						continue;
					};

					const effectBase = BossManager.effectBases.get(effect.id);
					try {
						if (actionName in effectBase.callback)
							effectBase.callback[actionName].call(null, this, effect, data);
						
					} catch (error) {
						console.error(error);
					}
				}

			
				/** Curse */
				if (actionName in (userData.cursesCallbackMap ?? {}))
				for (const curse of [...userData.curses]){
					const curseBase = CurseManager.cursesBase.get(curse.id);
					try {
						if (actionName in curseBase.callback)
							curseBase.callback[actionName].call(null, this, curse, data);
					
					} catch (err) {
						console.error(err);
					}
				}
				
			
				/** generalize */
				if (actionName !== ActionManager.Actions.any){
					this.action(ActionManager.Actions.any, {actionName, data});
				};
			}

		});
	}
}

export default ActionManager;
export { ActionsMap as Actions }