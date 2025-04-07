import dayjs from '#src/dayjs.js'
import ErrorsHandler from '#src/ErrorsHandler/ErrorsHandler.js'
import { timeEvents_singleton } from '#src/events/time/timeEvents_singleton.js'
import {
	is_already_executed ,
	once_per_day_task ,
} from '#src/new_day_hook/once_per_day.js'

class Event {
	options = {
		name: 'timeEvent/new-day' ,
	}

	calculateDelayUntilNextDay() {
		return dayjs().endOf( 'date' ).add( 1 , 'second' ).diff()
	}

	async run( timeEventData ) {
		if ( is_already_executed() ) {
			return
		}
		const context = {
			timeEventData ,
		}
		this.scheduleNextCall()
		// execute daily tasks ↴
		for ( const task of once_per_day_task ) {
			try {
				task.call( this , context )
			} catch ( error ) {
				ErrorsHandler.onErrorReceive( error )
			}
		}
	}

	scheduleNextCall() {
		const delay = this.calculateDelayUntilNextDay()
		timeEvents_singleton.pushIntoBuffer( 'new-day' , delay )
	}
}

export default Event
