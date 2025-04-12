import { SECOND } from '#constants/time.js'
import { cursesBase } from '#src/curses/CurseManager/curses/curses.js'
import { CurseManager } from '#src/curses/CurseManager/singleton/index.js'
import { sleep } from '#src/safe-utils.js'
import {
	get_or_init_snowy_in ,
	time_for_snowy_event ,
} from '#src/snowyEvent/lifecycle.js'

export const PRE_PHRASES = [
	() => 'Эта музыка не спешит заканчиваться :notes:' ,
	() => 'Хо-хо-хо :robot:' ,
	() =>
		'**Хо-хо-хо, @everyone, Отправляйте сообщения, чтобы получить проклятие зимнего праздника :snowflake: !**' ,
]
export const SNOWFLAKES_TO_PRESENT = 200

export async function onGetCoinMessage( { user , message } ) {
	const { guild } = message
	if ( !guild ) {
		return
	}
	if ( !time_for_snowy_event.isFactualActive() ) {
		return false
	}

	const snowyEvent = get_or_init_snowy_in( guild )

	if ( snowyEvent.preGlowExplorers.length < PRE_PHRASES.length ) {
		if ( snowyEvent.preGlowExplorers.includes( user.id ) ) {
			return
		}
		message.react( '🌲' )
		snowyEvent.preGlowExplorers.push( user.id )
		message.channel.sendTyping()

		await sleep( SECOND * 2.5 )
		const content = PRE_PHRASES.at( snowyEvent.preGlowExplorers.length - 1 )()
		message.channel.msg( {
			reference: message.id ,
			content ,
		} )
		return
	}

	const userData =userDataOf(user)
	if ( userData.curses?.some( curse => curse.id === 'happySnowy' ) ) {
		return
	}

	message.react( '🌲' )
	const curseBase = cursesBase.get( 'happySnowy' )
	const curse = CurseManager.generateOfBase( {
		curseBase ,
		user ,
		context: { message , guild } ,
	} )
	CurseManager.init( { curse , user } )
}
