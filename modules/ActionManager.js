
import Discord from 'discord.js';
import { CurseManager, QuestManager } from '#src/modules/mod.js';
import { BossEffects } from '#src/modules/BossManager.js';

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
	// Other
	callCommand: "callCommand",
	inputCommandParsed: "inputCommandParsed",
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

				if (actionName in (userData.bossEffectsCallbackMap ?? {}))
				for (const effect of [...userData.bossEffects]){
					if (data.guild && effect.guildId !== data.guild.id){
						continue;
					};

					const effectBase = BossEffects.effectBases.get(effect.id);
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