import { client } from '#src/bot/client/singleton.js'
import EventsManager , { BaseEvent } from '#src/events/EventsManager.js'

class Event extends BaseEvent {
	options = {
		name: 'client/guildMemberUpdate' ,
	}

	constructor() {
		const EVENT = 'guildMemberUpdate'
		super( client , EVENT )
	}

	async run( previousState , newState ) {
		const isNameEdited
			= newState.user.data.name !== newState.user.username
				|| previousState.displayName !== newState.displayName
		if ( isNameEdited ) {
			EventsManager.emitter.emit(
				'client/userNameUpdate' ,
				previousState ,
				newState ,
			)
		}

		if ( previousState.roles.cache.size !== newState.roles.cache.size ) {
			EventsManager.emitter.emit(
				'client/guildMemberRolesUpdate' ,
				previousState ,
				newState ,
			)
		}
	}
}

export default Event
