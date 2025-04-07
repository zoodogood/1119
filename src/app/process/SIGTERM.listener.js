import EventsManager , { BaseEvent } from '#src/events/EventsManager.js'

class Event extends BaseEvent {
	options = {
		name: 'process/SIGTERM' ,
	}

	constructor() {
		const EVENT = 'SIGTERM'
		super( process , EVENT )
	}

	async run() {
		EventsManager.emitter.emit( 'beforeExit' )
	}
}

export default Event
