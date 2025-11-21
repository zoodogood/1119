import config from '#config'
import { Events } from '#src/app/events.enum.js'
import { client } from '#src/bot/client/singleton.js'
import { singletonBotData } from '#src/data/singleton.js'

import EventsManager , { BaseEvent } from '#src/events/EventsManager.js'
import { timeEvents_singleton } from '#src/events/time/timeEvents_singleton.js'
import { timestampDay } from '#src/safe-utils.js'

class Event extends BaseEvent {
	options = {
		name: 'client/ready' ,
	}

	constructor() {
		super( client , Events.ClientReady )
	}

	async postLoading() {
		timeEvents_singleton.onStartup()

		const needUpdate
			= singletonBotData().currentDay !== timestampDay( Date.now() )

		if ( needUpdate ) {
			await EventsManager.collection
				.get( 'timeEvent/new-day' )
				.run( { isLost: true } )
		}

		timeEvents_singleton
			.getEventsInRange( [
				timeEvents_singleton.getNearestDay() ,
				timeEvents_singleton.getNearestDay() + 1 ,
			] )
			.find( event => event.name === 'autosave' )
			|| ( await EventsManager.collection.get( 'timeEvent/autosave' ).run() )
	}

	async run() {
		await this.postLoading()
		console.info( '\n\n\n     Ready...\n\n' )
		config.enviroment.playground
		&& console.info( `Playground: ${ config.enviroment.playground }\n\n` )

		if ( process.env.IN_CONTAINER ) {
			console.info( `PROCESS_ID: ${ process.pid }` )
		}
		EventsManager.emitter.emit( Events.AppReady )
	}
}

export default Event
