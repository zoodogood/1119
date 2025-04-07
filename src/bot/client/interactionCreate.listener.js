import { CustomIdExecutor } from '#src/app/CustomIdExecutor/Executor.js'
import { client } from '#src/bot/client/singleton.js'
import { actionRowsToComponents } from '#src/discord/utils.js'
import { BaseEvent } from '#src/events/EventsManager.js'
import { sleep } from '#src/safe-utils.js'

import { ButtonStyle } from 'discord.js'

class Event extends BaseEvent {
	options = {
		name: 'client/interactionCreate' ,
	}

	constructor() {
		const EVENT = 'interactionCreate'
		super( client , EVENT )
	}

	async cleanUnhandled( interaction ) {
		if ( !interaction.isButton() ) {
			return
		}

		await sleep( 1000 )
		if ( interaction.replied || interaction.deffered ) {
			return
		}

		const current_components = actionRowsToComponents(
			interaction.message.components ,
		)
		const component = current_components
			.flat()
			.find( component => component.customId === interaction.customId )

		if ( !component ) {
			return
		}
		component.style = ButtonStyle.Danger
		interaction.message.msg( {
			edit: true ,
			components: current_components ,
		} )
	}

	async run( interaction ) {
		const { customId } = interaction

		if ( interaction.isCommand() ) {
			const { commandName } = interaction
			const command = CommandsManager.callMap.get( commandName )
			CommandsManager.execute( command , interaction )
		}
		if ( customId?.startsWith( '@' ) ) {
			const [ type , target , params ]
				= CustomIdExecutor.parseCustomId( customId ) ?? []
			type && CustomIdExecutor.emit( type , target , { params , interaction } )
		}

		this.cleanUnhandled( interaction )
	}
}

export default Event
