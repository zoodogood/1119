import { singletonBotData } from '#src/data/singleton.js'
import { timeEvents_singleton } from '#src/events/time/timeEvents_singleton.js'
import { timestampDay } from '#src/safe-utils.js'
import { arrayEmpty } from '@zoodogood/utils'
import dayjs from 'dayjs'

export default class {
	EVENT_NAME = 'partner-daemon'
	pull = ( new DaemonPull )
	_createTimeEvent() {
		const WEEK = 7
		const launched_events = timeEvents_singleton.filterEventsInRange(
			( { name } ) => name === this.EVENT_NAME ,
			[
				singletonBotData().currentDay ,
				singletonBotData().currentDay + WEEK + 1 ,
			] ,
		)

		if ( launched_events.length > 0 ) {
			launched_events
				.slice( 1 )
				.forEach(
					timeEvents_singleton.removeFromBuffer.bind( timeEvents_singleton ) ,
				)
			return
		}

		timeEvents_singleton.pushIntoBuffer(
			this.EVENT_NAME ,
			this.ms_to_timeEvent() ,
		)
	}

	checkTimeEvent() {
		const expected_exists = this.fetchTimeEvent()

		if ( !expected_exists ) {
			this._createTimeEvent()
		}
	}

	fetchTimeEvent() {
		const WEEK = 7
		const day = timestampDay( Date.now() )
		return timeEvents_singleton.findEventInRange(
			( { name } ) => name === this.EVENT_NAME ,
			[ day , day + WEEK + 1 ] ,
		)
	}

	ms_to_timeEvent() {
		return dayjs().endOf( 'week' ).add( 2 , 'day' ).set( 'hour' , 20 ) - Date.now()
	}

	onPartnerBump( context ) {
		this.pull.push( context.guild.id )
	}

	onTimeEvent() {
		arrayEmpty( this.pull )
		this._createTimeEvent()
	}
}

class DaemonPull extends Array {
	LIMIT = 20
	isPartnerInPull( guildId ) {
		return this.includes( guildId )
	}

	process_queue() {
		while ( this.length > this.LIMIT ) {
			this.shift()
		}
	}

	push( ... values ) {
		super.push( ... values )
		this.process_queue()
	}
}
