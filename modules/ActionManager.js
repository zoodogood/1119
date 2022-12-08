
import Discord from 'discord.js';
import { CurseManager, QuestManager } from '#src/modules/mod.js';

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
	bossMakeDamage: "bossMakeDamage",
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

				if (actionName === "globalQuest"){
					const questId = actionName === data.name;
					const questBase = QuestManager.questsBase.get(questId);
					QuestManager.onAction({user: this, questBase, data});
				}

				if (this.data.quest && QuestManager.HandlersMap.get(actionName) === this.data.quest.id){
					const questId = this.data.quest.id;
					const questBase = QuestManager.questsBase.get(questId);
					QuestManager.onAction({user: this, questBase, data});
				}

				// if (data.msg && data.msg.guild.data.boss){
				//   BossManager.effectBases[id].onAction.call(null, data);
				// }
			
				/** Curse */
				if (this.data.curses)
				for (const curse of [...this.data.curses]){
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