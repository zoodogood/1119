import process from 'node:process'
import readline from 'node:readline'
import EventsManager from '#src/events/EventsManager.js'
import { namedListen } from '#src/events/useNamedListener.js'
import { Events } from './events.enum.js'

const singleton = readline.createInterface( { input: process.stdin } )
export default namedListen( Events.StdinLine , singleton , 'line' , ( x ) => {
	EventsManager.emitter.emit( Events.StdinLine , x )
} )
