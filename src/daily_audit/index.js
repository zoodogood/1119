import DataManager from '#src/data/DataManager.js'

export const AUDIT_LIMIT_IN_DAYS = 365

export function collectDailyData() {
	const data = DataManager.data
	return {
		enterToPages: data.site.entersToPagesToday ,
		enterToAPI: data.site.entersToAPIToday ,
		commandsUsed: data.bot.commandsUsedToday ,
		messages: data.bot.messagesToday ,
		totalWealth:
			data.users.reduce( ( acc , { coins } ) => acc + ~~coins , 0 )
			+ data.guilds.reduce( ( acc , { coins } ) => acc + ~~coins , 0 ) ,
		bossDamageToday: data.bot.bossDamageToday ,
	}
}

export function updateDailyStatistics() {
	const { audit: auditData , bot: botData , site: siteData } = DataManager.data
	const currentDay = botData.currentDay
	// recordDailyData ↴
	DataManager.data.audit.daily[ botData.currentDay ] = collectDailyData()
	// reset daily counters ↴
	siteData.entersToPagesToday = 0
	siteData.entersToAPIToday = 0
	botData.commandsUsedToday = 0
	botData.messagesToday = 0
	botData.bossDamageToday = 0
	// removeOldDailyRecords ↴
	Object.keys( auditData.daily )
		.filter( day => currentDay - +day > AUDIT_LIMIT_IN_DAYS )
		.forEach( day => delete auditData.daily[ day ] )
}
