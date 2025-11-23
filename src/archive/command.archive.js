import { HOUR, SECOND } from '#constants/time.js'
import { BaseCommand } from '#src/commands/BaseCommand/BaseCommand.js'
import { PermissionsBits } from '#src/discord/permissions.js'

import { AttachmentBuilder } from 'discord.js'

class Command extends BaseCommand {
	options = {
		name: 'archive' ,
		id: 10 ,
		media: {
			description:
				'Архивирует сообщения в канале и отправляет содержимое пользователю в виде файла.' ,
			example: `!archive #без аргументов` ,
		} ,
		alias: 'arhive архив архів' ,
		allowDM: true ,
		cooldown: HOUR ,
		type: 'delete' ,
		userPermissions: PermissionsBits.ManageChannels ,
	}

	async onChatInput( msg ) {
		const channel = msg.channel
		const sum_messages = []
		const options = { limit: 100 }
		const date = ( new Date )
		let last_id
		let time = 0

		while ( true ) {
			if ( last_id )
				options.before = last_id
			const messages = await channel.messages.fetch( options , false )
			sum_messages.push( ... messages.values() )
			last_id = messages.last().id
			if ( messages.size !== 100 )
				break
			if ( ++time === 20 )
				msg.msg( { title: 'Нужно немного подождать' , delete: 3 * SECOND } )
			if ( ++time === 50 )
				msg.msg( { title: 'Ждите' , delete: 3 * SECOND } )
		}

		let input = `${ date }\n\n`
		let last
		sum_messages.reverse().forEach( ( item ) => {
			if ( !last || last.author.tag !== item.author.tag ) {
				const date = new Date( item.createdTimestamp )
				input
					+= `\n    ---${
						item.author.tag
					} ${
						date.getHours()
					}:${
						date.getMinutes()
					}\n`
			}
			input += `${ item.content }\n`
			last = item
		} )

		const buffer = Buffer.from( input.replace( 'undefined' , '' ) , 'utf-8' )

		msg.msg( {
			files: [ new AttachmentBuilder( buffer , { name: 'archive.txt' } ) ] ,
		} )
		if ( time > 35 )
			msg.msg( { title: 'Вот ваша печенька ожидания 🍪' } )
	}
}

export default Command
