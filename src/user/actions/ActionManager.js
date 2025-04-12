import { cursesBase } from '#src/curses/CurseManager/curses/curses.js'
import { DataManager , userDataOf } from '#src/data/singleton.js'
import ErrorsHandler from '#src/ErrorsHandler/ErrorsHandler.js'

import { QuestManager } from '#src/quests/QuestManager.js'
import { ActionsMap } from '#src/user/actions/actionsMap.enum.js'
import UserEffectManager from '#src/user/actions/EffectsManager.js'
import { User as DiscordUser } from 'discord.js'

class ActionManager {
	static Actions = ActionsMap

	static extendsGlobalPrototypes() {
		const ActionManager = this

		Object.defineProperty( DiscordUser.prototype , 'action' , {
			enumerable: false ,
			value( actionName , data ) {
				const userData = userDataOf( this )

				if ( QuestManager.isNeedInstallDailyQuest( { user: this } ) ) {
					if ( !userData.quest?.willUpdate ) {
						QuestManager.requestInstallDailyQuest( { user: this } )
						QuestManager.checkAvailable( { user: this } )
					}
				}

				if ( actionName === 'globalQuest' ) {
					const questId = data.name
					const questBase = QuestManager.questsBase.get( questId )
					QuestManager.onAction( { user: this , questBase , data } )
				}

				if (
					QuestManager.questsBase.get( userData.quest.id )?.handler === actionName
				) {
					const questId = userData.quest.id
					const questBase = QuestManager.questsBase.get( questId )
					QuestManager.onAction( { user: this , questBase , data } )
				}

				/** Effects */
				if ( actionName in ( userData.effectsCallbackMap ?? {} ) ) {
					for ( const effect of [ ... userData.effects ] ) {
						if ( effect.isDisabled ) {
							continue
						}
						const effectBase = UserEffectManager.store.get( effect.id )
						try {
							if ( actionName in effectBase.callback ) {
								effectBase.callback[ actionName ].call(
									effectBase ,
									this ,
									effect ,
									data ,
								)
							}
						} catch ( error ) {
							ErrorsHandler.onErrorReceive( error , {
								actionName ,
								source: 'EffectAction' ,
								effectId: effect.id ,
							} )
						}
					}
				}

				/** Curse */
				if ( actionName in ( userData.cursesCallbackMap ?? {} ) ) {
					for ( const curse of [ ... userData.curses ] ) {
						const curseBase = cursesBase.get( curse.id )
						try {
							if ( actionName in curseBase.callback ) {
								curseBase.callback[ actionName ].call(
									curseBase ,
									this ,
									curse ,
									data ,
								)
							}
						} catch ( error ) {
							ErrorsHandler.onErrorReceive( error , {
								actionName ,
								source: 'CurseAction' ,
								curseId: curse.id ,
							} )
						}
					}
				}

				const { audit } = DataManager.data
				if ( actionName === ActionsMap.resourceChange ) {
					const { source , value , resource } = data
					const sourceTarget = ( audit.resourcesChanges[ source ] ||= {} )
					const target = ( sourceTarget[ resource ] ||= {} )
					target[ Math.sign( value ) ] ||= 0
					target[ Math.sign( value ) ] += value
				}

				audit.actions[ actionName ] ||= 0
				audit.actions[ actionName ]++

				/** generalize */
				if ( actionName !== ActionManager.Actions.any ) {
					this.action( ActionManager.Actions.any , { actionName , data } )
				}
			} ,
		} )
	}
}

export default ActionManager
export { ActionsMap as Actions }
