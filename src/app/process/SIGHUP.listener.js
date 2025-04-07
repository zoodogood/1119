import EventsManager , { BaseEvent } from '#src/events/EventsManager.js'

class Event extends BaseEvent {
	options = {
		name: 'process/SIGHUP' ,
	}

	constructor() {
		const EVENT = 'SIGHUP'
		super( process , EVENT )
	}

	async run() {
		EventsManager.emitter.emit( 'beforeExit' )
	}
}

export default Event
