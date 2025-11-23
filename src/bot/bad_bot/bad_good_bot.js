import { HOUR , MINUTE, SECOND } from '#constants/time.js'
import client from '#src/bot/client/singleton.js'
import { guildDataOf } from '#src/data/singleton.js'
import { timeEvents_singleton } from '#src/events/time/timeEvents_singleton.js'
import { randomWith , sleep } from '#src/safe-utils.js'
import { Actions } from '#src/user/actions/ActionManager.js'

export async function stupid_bot( user , message ) {
	const { guild , channel } = message
	if ( channel.isDMBased() )
		return

	const guildData = guildDataOf( guild )
	message.author.action( Actions.callBot , {
		message ,
		channel ,
		type: 'stupid' ,
	} )

	if ( !guildData.stupid_evil ) {
		guildData.stupid_evil = 1
		timeEvents_singleton.pushIntoBuffer( 'cooled-bot' , HOUR * 15 , [
			message.guild.id ,
		] )
	}
	if ( guildData.stupid_evil > 37 ) {
		return
	}

	message.channel.sendTyping()
	await sleep( 2 * SECOND )
	switch ( guildData.stupid_evil ) {
	case 1:
		message.msg( { content: 'Недостаточно прав!' } )
		break

	case 2:
		message.msg( { content: '-_-' } )
		break

	case 3:
		message.msg( { content: '-_-\'' } )
		break

	case 5:
		message.msg( { content: 'Сами вы глупые!' } )
		break

	case 9:
		message.msg( { content: 'ДА НЕ БОМБИТ У МЕНЯ1!!' } )
		break

	case 21:
		message.msg( { content: '🖕' } ).then( async ( msg ) => {
			msg.react( '❕' )
			msg.react( '🇵' )
			msg.react( '🇮' )
			msg.react( '🇩' )
			msg.react( '🇴' )
			msg.react( '🇷' )
			await sleep( 5 * SECOND )
			msg.reactions.removeAll()
		} )
		break

	case 22:
		message.msg( {
			content:
					'Остановись, подумой думой своею. Не сделал, и не сделаю, ничего плохого я тебе. Оставь эту затею, Человек. Радуйся солнцу, земле. Не обидь словом ближнего своего' ,
		} )
		break

	case 34:
		message.msg( { content: 'Чел ну ты реально задрал' } )
		break

	case 35:
		message.msg( {
			content: '**(╯>□<\'）╯︵ ┻━┻**\nН-Ы-А #### НЫЫА НЫЫА НЫЫАААААА' ,
		} )
		client.user.setStatus( 'dnd' )
		setTimeout( () => client.user.setStatus( 'online' ) , 5 * MINUTE )
		break

	default:
		message.msg( { content: '...' } )
	}
	guildData.stupid_evil++
}

export function good_bot( user , msg ) {
	if ( randomWith( 1 ) )
		msg.react( '🍪' )
	msg.author.action( Actions.callBot , {
		msg ,
		channel: msg.channel ,
		type: 'good' ,
	} )
}
