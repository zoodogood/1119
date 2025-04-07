import client from '#src/bot/client/singleton.js'
import { disposableListen } from '#src/EventEmitter/export.js'
import { EventsManager } from '#src/events/EventsManager.js'

export function addCoinFromMessage( message ) {
	EventsManager.emitter.emit( 'users/getCoinsFromMessage' , {
		user: message.author ,
		message ,
	} )
}

export async function requestCoinFromNextMessage( userId ) {
	const { resolve , promise } = Promise.withResolvers()
	const unlisten = disposableListen( client , 'messageCreate' , ( message ) => {
		message.author.id === userId && resolve( message )
	} )
	const message = await promise
	unlisten()
	addCoinFromMessage( message )
	return message
}
