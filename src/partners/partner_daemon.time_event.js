import CommandsManager from '#src/commands/CommandsManager/singleton.js'

class Event {
	options = {
		name: 'timeEvent/partner-daemon' ,
	}

	async run( timeEventData ) {
		const instance = CommandsManager.collection.get( 'partners' )
		instance.daemon.onTimeEvent( timeEventData )
	}
}

export default Event
