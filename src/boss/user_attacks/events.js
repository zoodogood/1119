import BossManager from '#src/boss/BossManager.js'
import { ErrorsHandler } from '#src/ErrorsHandler/ErrorsHandler.js'
import { checkFilterPropertyFactory } from '#src/mini.js'

export function resolve_attack_events_pull( context ) {
	return [ ... BossManager.eventBases.values() ]
		.filter( checkFilterPropertyFactory( context ) )
		.map( event => ( {
			... event ,
			_weight:
				typeof event.weight === 'function'
					? event.weight( context )
					: event.weight ,
		} ) )
}

export async function attack_event_callback( event , context ) {
	try {
		await event.callback.call( event , context )
	} catch ( error ) {
		ErrorsHandler.onErrorReceive( error , { source: 'BossAttackAction' } )
		context.channel.msg( {
			title: `Источник исключения: ${ event.id }. Он был убран из списка возможных событий на неопределенный срок` ,
			description: `**${ error.message }:**\n${ error.stack }` ,
		} )
		BossManager.eventBases.delete( event.key )
	}
}
