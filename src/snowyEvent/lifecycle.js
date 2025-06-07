import DataManager from '#src/data/DataManager.js'
import { guildDataOf , singletonBotData } from '#src/data/singleton.js'

export function init_snowy_in( guild ) {
	return ( guildDataOf( guild ).snowyEvent = { preGlowExplorers: [] , isArrived: true } )
}

export function get_snowy_in( guild ) {
	return guildDataOf( guild ).snowyEvent
}

export function get_or_init_snowy_in( guild ) {
	return get_snowy_in( guild ) || init_snowy_in( guild )
}

export function mark_as_started() {
	singletonBotData().snowyEvent = true
}

export const time_for_snowy_event = {
	isFactualActive() {
		return !!singletonBotData().snowyEvent
	} ,

	todayIsSnowy() {
		const [ day , month ] = singletonBotData().dayDate
		return +month === 12 && +day >= 20
	} ,
}

export function fully_clean() {
	delete singletonBotData().snowyEvent
	for ( const guildData of DataManager.data.guilds ) {
		delete guildData.snowyEvent
	}
	// todo
}
