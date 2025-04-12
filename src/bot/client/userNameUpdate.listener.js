import { userDataOf } from '#root/src/data/singleton.js'
import { sendToLogsChannel } from '#root/src/guild_special_channels/special_channel_enum.js'
import { REASON_FOR_CHANGE_NICKNAME as CHILLI_REASON_FOR_CHANGE_NICKNAME } from '#src/chilli/command.chilli.js'
import EventsManager , { BaseEvent } from '#src/events/EventsManager.js'
import { AuditLogEvent } from 'discord.js'

class Event extends BaseEvent {
	options = {
		name: 'client/userNameUpdate' ,
	}

	constructor() {
		const EVENT = 'client/userNameUpdate'
		super( EventsManager.emitter , EVENT )
	}

	async checkAudit( newState ) {
		const { guild , user } = newState

		if ( !guild ) {
			return
		}

		const entry = await guild.Audit( entry => entry.target.id === user.id , {
			type: AuditLogEvent.MemberUpdate ,
		} )

		if ( !entry ) {
			return null
		}

		return entry
	}

	async getContext( previousState , newState ) {
		const guild = newState.guild

		const { reason } = ( await this.checkAudit( newState ) ) ?? {}

		const isChangedOnlyDisplayName
			= previousState.displayName !== newState.displayName

		const [ previousValue , newValue ] = isChangedOnlyDisplayName
			? [ previousState.displayName , newState.displayName ]
			: [ previousState.user.username , newState.user.username ]

		return {
			guild ,
			reason ,
			previousState ,
			newState ,
			isChangedOnlyDisplayName ,
			previousValue ,
			newValue ,
		}
	}

	async run( previousState , newState ) {
		const context = await this.getContext( previousState , newState )

		const { isChangedOnlyDisplayName , guild , reason } = context

		if ( !isChangedOnlyDisplayName ) {
		userDataOf(	newState.user).name = newState.user.username
		}

		const isLogNeed = reason !== CHILLI_REASON_FOR_CHANGE_NICKNAME && guild

		if ( isLogNeed ) {
			this.sendAuditLog( context )
		}
	}

	sendAuditLog( context ) {
		const {
			guild ,
			isChangedOnlyDisplayName ,
			newState ,
			previousValue ,
			newValue ,
			reason ,
		} = context
		const title = `Новое имя: ${ newValue }`

		sendToLogsChannel( guild , {
			title ,
			description: reason ? `Указанная причина: ${ reason }` : null ,
			author: {
				name: isChangedOnlyDisplayName
					? 'На сервере изменился\nник пользователя'
					: 'Участник изменил свой никнейм' ,
				iconURL: newState.user.avatarURL() ,
			} ,
			footer: { text: `Старый никнейм: ${ previousValue }` } ,
		} )
	}
}

export default Event
