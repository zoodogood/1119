import { HOUR } from '#constants/time.js'
import { guildDataOf } from '#root/src/data/singleton.js'
import client from '#src/bot/client/singleton.js'
import { timeEvents_singleton } from '#src/events/time/timeEvents_singleton.js'
import { randomWith , sleep } from '#src/safe-utils.js'
import { Actions } from '#src/user/actions/ActionManager.js'

export async function stupid_bot( user , msg ) {
	if ( msg.channel.isDMBased() )
		return

	msg.author.action( Actions.callBot , {
		msg ,
		channel: msg.channel ,
		type: 'stupid' ,
	} )

	if ( !guildDataOf( msg.guild ).stupid_evil ) {
		guildDataOf(	msg.guild ).stupid_evil = 1
		timeEvents_singleton.pushIntoBuffer( 'cooled-bot' , HOUR * 15 , [
			msg.guild.id ,
		] )
	}
	if ( guildDataOf( msg.guild ).stupid_evil > 37 ) {
		return
	}

	msg.channel.sendTyping()
	await sleep( 2000 )
	switch ( guildDataOf( msg.guild ).stupid_evil ) {
	case 1:
		msg.msg( { content: 'Недостаточно прав!' } )
		break

	case 2:
		msg.msg( { content: '-_-' } )
		break

	case 3:
		msg.msg( { content: '-_-\'' } )
		break

	case 5:
		msg.msg( { content: 'Сами вы глупые!' } )
		break

	case 9:
		msg.msg( { content: 'ДА НЕ БОМБИТ У МЕНЯ1!!' } )
		break

	case 21:
		msg.msg( { content: '🖕' } ).then( async ( msg ) => {
			msg.react( '❕' )
			msg.react( '🇵' )
			msg.react( '🇮' )
			msg.react( '🇩' )
			msg.react( '🇴' )
			msg.react( '🇷' )
			await sleep( 5000 )
			msg.reactions.removeAll()
		} )
		break

	case 22:
		msg.msg( {
			content:
					'Остановись, подумой думой своею. Не сделал, и не сделаю, ничего плохого я тебе. Оставь эту затею, Человек. Радуйся солнцу, земле. Не обидь словом ближнего своего' ,
		} )
		break

	case 34:
		msg.msg( { content: 'Чел ну ты реально задрал' } )
		break

	case 35:
		msg.msg( {
			content: '**(╯>□<\'）╯︵ ┻━┻**\nН-Ы-А #### НЫЫА НЫЫА НЫЫАААААА' ,
		} )
		client.user.setStatus( 'dnd' )
		setTimeout( () => client.user.setStatus( 'online' ) , 300000 )
		break

	default:
		msg.msg( { content: '...' } )
	}
	guildDataOf(	msg.guild ).stupid_evil++
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
