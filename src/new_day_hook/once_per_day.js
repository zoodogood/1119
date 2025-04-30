import config from '#config'
import { NEW_YEAR_DAY_DATE } from '#constants/time.js'
import BossManager from '#src/boss/BossManager.js'
import client from '#src/bot/client/singleton.js'
import { updateDailyStatistics } from '#src/daily_audit/index.js'
import DataManager from '#src/data/DataManager.js'
import { PropertiesEnum } from '#src/data/Properties.js'
import { singletonBotData, userDataOf } from '#src/data/singleton.js'
import EventsManager from '#src/events/EventsManager.js'
import { timeEvents_singleton } from '#src/events/time/timeEvents_singleton.js'
import { update_product_list as grempen_update_product_list } from '#src/grempen/once_per_day.js'
import { factorySummarize } from '#src/mini.js'
import { timestampDay , toDayDate } from '#src/safe-utils.js'
import {
	fully_clean as snowy_fully_clean ,
	mark_as_started as snowy_mark_as_started ,
	time_for_snowy_event ,
} from '#src/snowyEvent/lifecycle.js'
import { addResource } from '#src/user/resources/addResource.js'
import { _WEIGHT_AUTO , randomElementFromArray } from '@zoodogood/utils/objectives'
import { ending } from '@zoodogood/utils/primitives'

export function is_already_executed() {
	return singletonBotData().dayDate === toDayDate( Date.now() )
}

export const once_per_day_task = [
	// current day ↴
	() => {
		const today = toDayDate( Date.now() )
		const currentDay = timestampDay( Date.now() )
		singletonBotData().dayDate = today
		singletonBotData().currentDay = currentDay
	} ,
	// snowyEventLifecycle ↴
	() =>
		time_for_snowy_event.todayIsSnowy()
			? !time_for_snowy_event.isFactualActive() && snowy_mark_as_started()
			: time_for_snowy_event.isFactualActive() && snowy_fully_clean() ,
	// distributeNewYearPresents ↴
	( context ) => {
		if ( singletonBotData().dayDate !== NEW_YEAR_DAY_DATE ) {
			return
		}

		const usersCache = client.users.cache

		for ( const user of usersCache.values() ) {
			addResource( {
				user ,
				value: 1 ,
				executor: null ,
				source: 'timeEvents.event.new-day.happySnowy' ,
				resource: PropertiesEnum.presents ,
				context ,
			} )
		}

		const users = DataManager.data.users
		client.channels.cache.get( config.guild.logChannelId )?.msg( {
			content: `${ ending(
				usersCache.size ,
				'пользовател' ,
				'ей получило' ,
				'ь получил' ,
				'ля получило' ,
			) } подарки! из ${ users.length } возможных*` ,
		} )
	} ,
	// scheduleDayStatsEvent ↴
	async () => {
		const botData = singletonBotData()
		const existingEvents = timeEvents_singleton.filterEventsInRange(
			( { name } ) => name === 'day-stats' ,
			[ botData.currentDay , botData.currentDay + 1 ] ,
		)
		if ( existingEvents.length > 0 ) {
			return
		}

		await EventsManager.collection
			.get( 'timeEvent/day-stats' )
			.time_event_recreate()
	} ,
	// triggerBossAppearance ↴
	() => client.guilds.cache.each( guild => BossManager.checkLifecycleFor( guild ) ) ,
	// grempen_update_product_list ↴
	grempen_update_product_list ,
	// updateDailyStatistics ↴
	updateDailyStatistics ,
	// annonce_birthdays ↴
	() => {
		const { dayDate } = singletonBotData()
		const birthdayCount = client.users.cache.filter(
			user => !user.bot && userDataOf( user ).BDay === dayDate ,
		).size

		if ( !birthdayCount ) {
			return
		}
		client.channels.cache.get( config.guild.logChannelId )?.msg( {
			content: `Сегодня день рождения у ${ birthdayCount } пользователя(ей)` ,
		} )
	} ,
	// adjustBerryPrices ↴
	() => {
		const botData = singletonBotData()
		const priceModifiers = [
			{ _weight: 10 , price: 1 } ,
			{ _weight: 1 , price: -7 } ,
			{ _weight: 5 , price: 3 } ,
		]
		const randomModifier = randomElementFromArray( priceModifiers , { associatedWeights: _WEIGHT_AUTO } ).price
		const targetPrice = Math.sqrt( client.users.cache.size / 3 ) * 7 + 200
		botData.berrysPrice += Math.round(
			( targetPrice - botData.berrysPrice ) / 30 + randomModifier ,
		)
	} ,
	// commands_usage ↴
	() => {
		const { guilds , bot } = DataManager.data

		for ( const guildData of guilds ) {
			guildData.commandsLaunched = Object.values( guildData.commandsUsed ).reduce(
				factorySummarize() ,
				0 ,
			)
		}

		bot.commandsLaunched = Object.values( bot.commandsUsed ).reduce(
			factorySummarize() ,
			0 ,
		)
	} ,
]
