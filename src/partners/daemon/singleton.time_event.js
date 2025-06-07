import { daemon_singleton } from './singleton.js'

class Event {
	options = {
		name: 'timeEvent/partner-daemon' ,
	}

	async run( timeEventData ) {
		daemon_singleton.onTimeEvent( timeEventData )
	}
}

export default Event
