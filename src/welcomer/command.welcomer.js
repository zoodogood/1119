import client from '#src/bot/client/singleton.js'
import { BaseCommand } from '#src/commands/BaseCommand/BaseCommand.js'
import { SECOND } from '#src/constants/time.js'
import { guildDataOf } from '#src/data/singleton.js'
import { PermissionsBits } from '#src/discord/permissions.js'
import { awaitInteractOrMessage } from '#src/discord/utils.js'

class Command extends BaseCommand {
	options = {
		name: 'welcomer' ,
		id: 13 ,
		media: {
			description:
				'Бот будет приветствовать новых пользователей именно так, как вы ему скажете, может выдавать новичкам роли, отправлять в канал ваше сообщение или просто помахать рукой.' ,
			example: `!welcomer (без аргументов)` ,
		} ,
		alias: 'установитьприветствие sethello приветствие привітання' ,
		allowDM: true ,
		type: 'guild' ,
		userPermissions: PermissionsBits.ManageGuild ,
	}

	async onChatInput( msg , interaction ) {
		const guild = msg.guild
		let answer

		if ( guildDataOf( guild ).hi ) {
			const early = await msg.msg( {
				title: 'Ранее установленное приветствие:' ,
				color: guildDataOf( guild ).hi.color ,
				image: guildDataOf( guild ).hi.image ,
				description: guildDataOf( guild ).hi.message ,
				scope: { tag: msg.author.toString() , name: msg.author.username } ,
				footer: { text: 'Нажмите реакцию, чтобы продолжить редактирование' } ,
			} )
			const react = await early.awaitReact(
				{ user: msg.author , removeType: 'all' , time: 20 * SECOND } ,
				'✏️' ,
			)
			early.delete()
			if ( !react )
				return
		}

		const whatMessage = await msg.msg( {
			title:
				'Введите сообщение с которым бот будет встречать новых пользователей!' ,
			description: `Используйте шаблонные строки m'context.name, они знатно вам помогут!` ,
		} )
		answer = await msg.channel.awaitMessage( { user: msg.author } )
		if ( !answer ) {
			return
		}

		const message = answer.content
		whatMessage.delete()

		const whatColor = await msg.msg( {
			title: 'Укажите цвет в формате HEX `#38f913`' ,
			description: 'Используйте реакцию ❌, чтобы пропустить этот пункт' ,
		} )

		answer = await awaitInteractOrMessage( {
			target: whatColor ,
			user: interaction.user ,
			reactionOptions: { reactions: [ '❌' ] } ,
		} )
		if ( !answer ) {
			return
		}

		const color = answer.content ? answer.content.replace( '#' , '' ) : null
		whatColor.delete()

		const whatImage = await msg.msg( {
			title: 'Укажите ссылку на изображение' ,
			description: 'Или пропустите этот пункт' ,
		} )
		answer = await awaitInteractOrMessage( {
			target: whatImage ,
			user: interaction.user ,
			reactionOptions: { reactions: [ '❌' ] } ,
		} )
		if ( !answer ) {
			return
		}

		const image = answer.content || null
		whatImage.delete()
		if ( image && !image.startsWith( 'http' ) ) {
			return msg.msg( {
				title: 'Вы должны указать ссылку на изображение' ,
				color: '#ff0000' ,
				delete: 3 * SECOND ,
			} )
		}

		let rolesId
		const whatRoles = await msg.msg( {
			title:
				'Вы можете указать айди ролей через пробел, они будут выдаваться всем новым пользователям' ,
			description: 'Этот пункт тоже можно пропустить' ,
		} )
		answer = await awaitInteractOrMessage( {
			target: whatRoles ,
			user: interaction.user ,
			reactionOptions: { reactions: [ '❌' ] } ,
		} )
		if ( !answer )
			return
		whatRoles.delete()
		if ( answer.content ) {
			rolesId = answer.content.split( ' ' )
			const roles = rolesId
				.map( el => msg.guild.roles.cache.get( el ) )
				.filter( el => el )
			if ( rolesId.length !== roles.length ) {
				return msg.msg( {
					title: `Не удалось найти роли по следующим иденфикаторам: ${ rolesId
						.filter( roleId => !roles.map( role => role.id ).includes( roleId ) )
						.join( ' ' ) }` ,
					delete: 5 * SECOND ,
					color: '#ff0000' ,
				} )
			}
		} else {
			rolesId = false
		}

		const whatChannel = await msg.msg( {
			title: 'Упомяните канал для отправки приветсвий или...' ,
			color: '#ffff00' ,
			description: `📥 - Установить в этом канале ${
				guild.channels.cache.get( guildDataOf( guild ).hi.channel )
					? `\nСейчас установлен:\n${
						guild.channels.cache.get( guildDataOf( guild ).hi.channel ).toString()
					} - Оставить как есть 🔰`
					: ''
			}` ,
		} )
		answer = await awaitInteractOrMessage( {
			target: whatChannel ,
			user: interaction.user ,
			reactionOptions: {
				reactions: [ '📥' , guildDataOf( guild ).hi.channel ? '🔰' : null ] ,
			} ,
		} )
		whatChannel.delete()
		if ( !answer ) {
			return
		}

		const channelId
			= answer.emoji?.toString() === '🔰'
				? guildDataOf( guild ).hi.channel
				: answer.emoji?.toString() === '📥'
					? interaction.channel.id
					: answer.content?.match( /\d{16,21}/ )?.[ 0 ]

		const channel = client.channels.cache.get( channelId )
		if ( !channel ) {
			interaction.channel.msg( {
				title: `Канал, #id:${ channelId ?? 'null' }, не найден` ,
			} )
			return
		}

		guildDataOf( guild ).hi = { message , color , image , rolesId , channel: channelId }
		msg.msg( {
			title: 'Готово! Предпросмотр: На сервере новый участник' ,
			color ,
			image ,
			description: message ,
			scope: { tag: msg.author.toString() , name: msg.author.username } ,
		} )
	}
}

export default Command
