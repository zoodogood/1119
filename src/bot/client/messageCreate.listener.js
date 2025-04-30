import BossManager from '#src/boss/BossManager.js'
import { good_bot , stupid_bot } from '#src/bot/bad_bot/bad_good_bot.js'
import client from '#src/bot/client/singleton.js'
import { filterChat } from '#src/chat_filter.js/filter.js'
import { process_spam_protocol } from '#src/chat_filter.js/inSpamSystem.js'
import { addCoinFromMessage } from '#src/coin_message/requestCoinFromMessage.js'
import CommandsManager from '#src/commands/CommandsManager/singleton.js'

import DataManager from '#src/data/DataManager.js'
import { PropertiesEnum } from '#src/data/Properties.js'
import { guildDataOf , singletonBotData, userDataOf } from '#src/data/singleton.js'
import EventsManager , { BaseEvent } from '#src/events/EventsManager.js'
import { EXPERIENCE_PER_LEVEL } from '#src/level/constants.js'
import { randomWith } from '#src/safe-utils.js'
import { ActionsMap } from '#src/user/actions/actionsMap.enum.js'
import { addResource } from '#src/user/resources/addResource.js'

class Event extends BaseEvent {
	options = {
		name: 'client/messageCreate' ,
	}

	constructor() {
		const EVENT = 'messageCreate'
		super( client , EVENT )
	}

	async run( message ) {
		const guildData = message.guild?.data
		const user = message.author
		const userData = userDataOf( user )
		singletonBotData().messagesToday++
		if ( message.author.bot ) {
			return
		}

		message.author.action( ActionsMap.messageCreate , message )
		const commandContext
			= CommandsManager.parseInputCommandFromMessage( message )
		const command = commandContext?.command
		if (
			commandContext
			&& CommandsManager.checkAvailable( command , commandContext )
		) {
			CommandsManager.execute( command , commandContext )
		}

		userData.last_online = Date.now()

		if ( guildData?.boss && guildData.boss.isArrived ) {
			BossManager.onMessage.call( BossManager , message )
		}

		if (
			message.content
				.toLowerCase()
				.match(
					/((ухуель|глупый|тупой|дурной|бездарный|дурний) бот)|(бот (ухуель|глупый|тупой|дурной|бездарный|дурний))/i ,
				)
		) {
			stupid_bot( userData , message )
		}
		if (
			message.content
				.toLowerCase()
				.match(
					/((классный|умный|хороший|милый) бот)|(бот (классный|умный|хороший|милый))/i ,
				)
		) {
			good_bot( userData , message )
		}

		message.guild && guildDataOf( message.guild ).chatFilter && filterChat( message )
		if ( !process_spam_protocol( user ) ) {
			return
		}
		if ( randomWith( 1 , 85 * 0.9 ** userData.voidCoins ) === 1 ) {
			addCoinFromMessage( message )
		}

		addResource( {
			user ,
			source: 'event.messageCreate.getExperienceFromMessage' ,
			value: 1 ,
			executor: user ,
			resource: PropertiesEnum.exp ,
			context: { message } ,
		} )
		if ( userData.exp >= userData.level * EXPERIENCE_PER_LEVEL ) {
			EventsManager.emitter.emit( 'users/levelIncrease' , {
				user ,
				message ,
			} )
		}

		if ( message.guild ) {
			const memberData = ( guildDataOf( message.guild ).members[ message.author.id ] ||= {} )
			memberData.messagesToday ||= 0
			memberData.messagesToday++
			guildData.day_msg++
		}
	}
}

export default Event
