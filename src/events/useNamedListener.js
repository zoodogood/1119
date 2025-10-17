import { BaseEvent } from '#src/events/EventsManager.js'

export function namedListen( name , emitter , eventName , fn ) {
	return class extends BaseEvent {
		constructor() {
			super( emitter , eventName , { name } )
		}

		async run( ... x ) {
			await fn( ... x )
		}
	}
}
