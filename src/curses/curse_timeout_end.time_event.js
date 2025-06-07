import { client } from '#src/bot/client/singleton.js'
import { createDefaultPreventable } from '#src/createDefaultPreventable.js'
import { ActionsMap } from '#src/user/actions/actionsMap.enum.js'

class Event {
	options = {
		name: 'timeEvent/curse-timeout-end' ,
	}

	run( timeEventData , userId , timestamp ) {
		const user = client.users.cache.get( userId )
		if ( !user ) {
			return
		}

		const curses = userDataOf( user ).curses
		const context = {
			timeEventData ,
			timestamp ,
			user ,
			... createDefaultPreventable() ,
		}
		user.action( ActionsMap.timeEventCurseTimeoutEnd , context )
		if ( context.defaultPrevented() ) {
			return
		}
		if ( !curses ) {
			return
		}

		const compare = curse => curse.timestamp === timestamp
		const curse = curses.find( compare )

		if ( !curse ) {
			return
		}

		CurseManager.checkAvailable( { user , curse } )
	}
}

export default Event
