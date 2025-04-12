import { CALCULATE_CLOVER_MULTIPLAYER } from '#src/coin_message/clover/contstants.js'
import { PropertiesEnum } from '#src/data/Properties.js'
import { addResource } from '#root/src/user/resources/addResource.js'
import EventsManager , { BaseEvent } from '#src/events/EventsManager.js'
import * as SnowyEvent from '#src/snowyEvent/lifecycle.js'
import { onGetCoinMessage as SnowyOnGetCoinMessage } from '#src/snowyEvent/onGetCoinMessage.js'
import { Actions } from '#src/user/actions/ActionManager.js'
import { ending } from '@zoodogood/utils/primitives'

class Event extends BaseEvent {
	options = {
		name: 'users/getCoinsFromMessage' ,
	}

	constructor() {
		const EVENT = 'users/getCoinsFromMessage'
		super( EventsManager.emitter , EVENT )
	}

	calculateMultiplayer( { user , message } ) {
		const { guild } = message
		const userData =userDataOf(user)
		let k = 1

		if ( SnowyEvent.time_for_snowy_event.isFactualActive() ) {
			k += 0.2
		}

		if ( guild && 'cloverEffect' inguldDataOf(guild) ) {
			const value = CALCULATE_CLOVER_MULTIPLAYER( guildDataOf(guild).cloverEffect.uses )
			const multiplayer = value * 1.12 ** ( userData.voidMysticClover ?? 0 )
			k += multiplayer
		}

		return k
	}

	async onGetCoinsFromMessage( { user , message } ) {
		const userData =userDataOf(user)
		const { guild } = message
		user.action( Actions.coinFromMessage , {
			channel: message.channel ,
		} )

		let reaction = '637533074879414272'
		const k = this.calculateMultiplayer( { user , message } )
		if ( SnowyEvent.time_for_snowy_event.isFactualActive() ) {
			reaction = '❄️'
		}

		if ( guild && 'cloverEffect' inguldDataOf(guild) ) {
			reaction = '☘️'
			guildDataOf(guild).cloverEffect.coins++
		}

		const coins = Math.round( ( 35 + ( userData.coinsPerMessage ?? 0 ) ) * k )
		addResource( {
			user ,
			executor: user ,
			value: coins ,
			source: 'eventsManager.event.users.getCoinsFromMessage' ,
			resource: PropertiesEnum.coins ,
			context: { message , guild } ,
		} )
		addResource( {
			user ,
			executor: user ,
			value: 5 ,
			source: 'eventsManager.event.users.getCoinsFromMessage' ,
			resource: PropertiesEnum.chestBonus ,
			context: { message , guild } ,
		} )

		const react = await message.awaitReact(
			{ user: message.author , removeType: 'full' , time: 20000 } ,
			reaction ,
		)

		if ( !react ) {
			return
		}

		const messageContent = `> У вас ${ ending(
			userData.coins ,
			'коин' ,
			'ов' ,
			'' ,
			'а' ,
		) } <:coin:637533074879414272>!\n> Получено ${ coins }\n> Бонус сундука: ${
			userData.chestBonus || 0
		}`
		message.msg( { content: messageContent , delete: 3_000 } )
	}

	async run( { user , message } ) {
		this.onGetCoinsFromMessage( { user , message } )
		SnowyOnGetCoinMessage( { user , message } )
	}
}

export default Event
