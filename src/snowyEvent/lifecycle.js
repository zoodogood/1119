import DataManager from '#src/data/DataManager.js'

export function init_snowy_in( guild ) {
	return ( guild.data.snowyEvent = { preGlowExplorers: [] , isArrived: true } )
}

export function get_snowy_in( guild ) {
	return guild.data.snowyEvent
}

export function get_or_init_snowy_in( guild ) {
	return get_snowy_in( guild ) || init_snowy_in( guild )
}

export function mark_as_started() {
	DataManager.data.bot.snowyEvent = true
}

export const time_for_snowy_event = {
	isFactualActive() {
		return !!DataManager.data.bot.snowyEvent
	} ,

	todayIsSnowy() {
		const [ day , month ] = DataManager.data.bot.dayDate
		return +month === 12 && +day >= 20
	} ,
}

export function fully_clean() {
	delete DataManager.data.bot.snowyEvent
	for ( const guildData of DataManager.data.guilds ) {
		delete guildData.snowyEvent
	}
	// todo
}
