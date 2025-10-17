import EventsManager from '#src/events/EventsManager.js'
import { namedListen } from '#src/events/useNamedListener.js'
import { beforeProcessExit } from './singleton.js'

export default namedListen(
	'uptime/flushToFile' ,
	EventsManager.emitter ,
	'beforeExit' ,
	beforeProcessExit ,
)
