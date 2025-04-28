import { current_health } from '#src/boss/health.js'
import { EffectInfluenceEnum } from '#src/user/actions/EffectsManager.js'

export default {
	id: 'boss.makeDamageByBossCurrentHealthPoints' ,
	callback: {
		bossBeforeAttack: ( user , effect , data ) => {
			const {
				values: { guildId } ,
			} = effect

			const { guild } = data
			if ( guild.id !== guildId ) {
				return
			}

			const { attackContext , boss } = data
			const { power , multiplayer } = effect.values

			const currentHealth = current_health( boss )
			const damage = Math.floor( currentHealth * power * multiplayer )
			attackContext.addableDamage += damage
		} ,
	} ,
	values: {
		multiplayer: () => 1 ,
		power: () => 0.001 ,
		guildId: ( user , effect , { guild } ) => guild?.id ,
	} ,
	influence: EffectInfluenceEnum.Positive ,
}
