import config from '#config'
import { sendErrorInfo } from '#src/ErrorsHandler/sendErrorInfo.js'
import { justSendMessage } from '@zoodogood/utils/discordjs'
import { InteractionResponse , Message } from 'discord.js'
/** @import {AdvancedPayload} from "@zoodogood/utils/discordjs" */

/**
 * @param {Parameters<typeof justSendMessage>[0]} target
 * @param {AdvancedPayload} options
 * @returns {Promise<Message |undefined>}
 */
export function pushMessage( target , options ) {
	return _pushMessage.call( target , options )
}
/**
 * @param {AdvancedPayload} options
 * @returns {Promise<Message | undefined>}
 */
export async function _pushMessage( options ) {
	options.color ||= config.development ? '#000100' : '#23ee23'

	const target
		= this instanceof InteractionResponse
			? this.interaction
			: this instanceof Message && !options.edit
				? this.channel
				: this

	const message = ( async () => {
		try {
			return await justSendMessage( target , options )
		} catch ( error ) {
			if ( error.message.includes( 'Unknown Message' ) ) {
				// assert options.edit === true
				return
			}
			if ( !error.message.includes( 'Invalid Form Body' ) ) {
				console.error( target , options )
				console.error( error )
				throw error
			}
			await sendErrorInfo( {
				description: 'Оригинальное сообщение не было доставлено' ,
				channel: target ,
				error ,
			} )
			throw new Error( error.message , { cause: error } )
		}
	} )()

	return message
}
