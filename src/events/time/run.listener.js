import EventsManager from '#src/events/EventsManager.js'
import { namedListen } from '#src/events/useNamedListener.js'
import { timeEvents_singleton } from './timeEvents_singleton.js'

export default namedListen( 'timeEventPerform' , timeEvents_singleton.emitter , 'timeEventPerform' , ( event ) => {
	const eventBase = EventsManager.collection?.get( `timeEvent/${ event.name }` )
	if ( !eventBase ) {
		throw new Error( `Unknown timeEvent: ${ event.name }` )
	}
	const params = event.params ?? []
	eventBase.run( event , ... params )
} )
