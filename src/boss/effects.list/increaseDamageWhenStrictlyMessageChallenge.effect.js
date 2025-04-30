import BossManager from '#src/boss/BossManager.js'
import { HOUR } from '#src/constants/time.js'
import { guildDataOf } from '#src/data/singleton.js'
import { asAccessor , factoryCompare , increment } from '#src/mini.js'
import { EffectInfluenceEnum } from '#src/user/actions/EffectsManager.js'

export default {
	id: 'boss.increaseDamageWhenStrictlyMessageChallenge' ,
	callback: {
		messageCreate: ( user , effect , message ) => {
			const {
				values: { guildId } ,
			} = effect

			const { guild } = message
			if ( guild.id !== guildId ) {
				return
			}

			const { power , multiplayer , goal , basic } = effect.values
			const userStats = BossManager.userStatsOf(
				guildDataOf( message.guild ).boss ,
				message.author.id ,
			)

			const currentHour = Math.floor( Date.now() / HOUR )

			const hoursMap = ( effect.values.hoursMap ||= {} )
			const messagesAtCurrentHour = asAccessor(
				() => hoursMap[ currentHour ] ,
				value => hoursMap[ currentHour ] = value ,
			)

			if ( currentHour in hoursMap === false ) {
				messagesAtCurrentHour( 0 )
				const previousHourMessages = Object.entries( hoursMap )
					.reduce(
						factoryCompare( $ => +$[ 0 ] , ( a , b ) => a > b ) ,
						[] ,
					)
					.at( 1 )

				if ( previousHourMessages === goal ) {
					userStats.damagePerMessage ||= 1
					userStats.damagePerMessage += Math.ceil( ( power + basic ) * multiplayer )
					message.react( '685057435161198594' )
				}
			}

			increment( messagesAtCurrentHour )
			if ( messagesAtCurrentHour() === goal ) {
				message.react( '998886124380487761' )
			}

			if ( messagesAtCurrentHour() === goal + 1 ) {
				message.react( '🫵' )
			}
		} ,
	} ,
	values: {
		multiplayer: () => 1 ,
		power: () => 1.5 ,
		basic: () => 2 ,
		goal: () => 30 ,
		hours: () => {} ,
		guildId: ( user , effect , { guild } ) => guild?.id ,
	} ,
	influence: EffectInfluenceEnum.Positive ,
}
