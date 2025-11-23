import { client } from '#src/bot/client/singleton.js'
import { SECOND } from '#src/constants/time.js'
import { sleep } from '#src/safe-utils.js'
import { randomElementFromArray } from '@zoodogood/utils/objectives'

class Event {
	options = {
		name: 'timeEvent/giveaway' ,
	}

	async run( eventData , channelId , messageId , winnersCount , roleId ) {
		const channel = client.channels.cache.get( channelId )
		if ( !channel ) {
			return
		}

		const giveaway = await channel.messages.fetch( messageId )

		const users = ( await giveaway.reactions.resolve( '🌲' ).users.fetch() ).filter(
			user => !user.bot ,
		)

		const winners = users.random( +winnersCount ).filter( Boolean )

		const embed = giveaway.embeds.at( 0 )
		const contents = {
			users: winners.length
				? `Всего участвующих: ${ users.size }\nПобедителей: ${ winners.length } 🌲`
				: '\n**Нет участников, нет и победителей..**' ,
			winnersEnum: winners
				.map(
					user =>
						`${ randomElementFromArray( [ '🍃' , '☘️' , '🌿' , '🌱' , '🌼' ] ) }" "${ user.toString() }` ,
				)
				.join( '\n' ) ,
		}

		giveaway.msg( {
			... embed ,
			color: '#7ab160' ,
			edit: true ,
			description: `${ embed.description }\n\n${ contents.users }` ,
			footer: { text: 'Раздача завершена' } ,
		} )
		if ( !winners.length ) {
			return
		}

		giveaway.msg( {
			title: 'Привет, удача — раздача завершена!' ,
			color: '#7ab160' ,
			description: `${ contents.winnersEnum }\nвы выиграли!` ,
			footer: { text: 'Мира и удачи всем' } ,
			reference: messageId ,
		} )

		if ( roleId ) {
			winners.forEach( user =>
				channel.guild.members.resolve( user ).roles.add( roleId , 'Win In Giveway' ) ,
			)
		}

		await sleep( SECOND )
		giveaway.reactions.cache.get( '🌲' ).remove()
	}
}

export default Event
