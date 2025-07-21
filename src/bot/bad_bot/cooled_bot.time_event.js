import { client } from '#src/bot/client/singleton.js'
import { guildDataOf } from '#src/data/singleton.js'

class Event {
	options = {
		name: 'timeEvent/cooled-bot' ,
	}

	run( eventData , guildId ) {
		const guild = client.guilds.cache.get( guildId )
		if ( !guild ) {
			return
		}
		delete guildDataOf( guild ).stupid_evil
	}
}

export default Event
