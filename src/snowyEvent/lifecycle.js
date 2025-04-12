import DataManager from '#src/data/DataManager.js'

export function init_snowy_in( guild ) {
	return ( guildDataOf(guild).snowyEvent = { preGlowExplorers: [] , isArrived: true } )
}

export function get_snowy_in( guild ) {
	return guildDataOf(guild).snowyEvent
}

export function get_or_init_snowy_in( guild ) {
	return get_snowy_in( guild ) || init_snowy_in( guild )
}

export function mark_as_started() {
	botData().snowyEvent = true
}

export const time_for_snowy_event = {
	isFactualActive() {
		return !!botData().snowyEvent
	} ,

	todayIsSnowy() {
		const [ day , month ] = botData().dayDate
		return +month === 12 && +day >= 20
	} ,
}

export function fully_clean() {
	delete botData().snowyEvent
	for ( const guildData of DataManager.data.guilds ) {
		delete guildData.snowyEvent
	}
	// todo
}
