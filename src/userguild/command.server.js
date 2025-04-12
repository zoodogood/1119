import { HOUR , SECOND } from '#constants/time.js'
import client from '#src/bot/client/singleton.js'
import { CALCULATE_CLOVER_MULTIPLAYER } from '#src/coin_message/clover/contstants.js'
import { BaseCommand } from '#src/commands/BaseCommand/BaseCommand.js'
import { timeEvents_singleton } from '#src/events/time/timeEvents_singleton.js'

import { timestampDay , timestampToDate } from '#src/safe-utils.js'
import Template from '#src/VirtualMachine/Template.js'
import { randomElementFromArray } from '@zoodogood/utils/objectives'
import { ending } from '@zoodogood/utils/primitives'
import { ChannelType , PresenceUpdateStatus } from 'discord.js'
import { guildDataOf } from '../data/singleton.js'
import { factorySummarize } from '../mini.js'

class Command extends BaseCommand {
	options = {
		name: 'server' ,
		id: 28 ,
		media: {
			description:
				'Отображает основную информацию и статистику о сервере, в том числе бонусы связанные с этим ботом.\nВ неё входят: количество пользователей, каналов, сообщений или эффект клевера (если есть), а также установленные каналы, дата создания и другое' ,
			example: `!server #без аргументов` ,
		} ,
		alias: 'сервер guild гильдия' ,
		allowDM: true ,
		type: 'guild' ,
	}

	getCloverData( guild ) {
		const { cloverEffect } = guldDataOf( guild )
		if ( !cloverEffect ) {
			return null
		}
		const day = timestampDay( cloverEffect.timestamp )
		const filter = ( { name , _params_as_json } ) =>
			name === 'clover-end' && _params_as_json.includes( guild.id )
		const event = timeEvents_singleton.at( day )?.find( filter )

		if ( !event ) {
			return null
		}

		const timeToEnd = event.timestamp - Date.now()
		const multiplayer = CALCULATE_CLOVER_MULTIPLAYER( cloverEffect.uses )

		return { timeToEnd , multiplayer , cloverEffect }
	}

	getCommandsLaunchedOfPreviousDaysInGuild( guild ) {
		return guildDataOf( guild ).commandsLaunched || 0
	}

	getContext( interaction ) {
		const { guild } = interaction
		return {
			guild ,
			commandsUsed: this.getUsedCommandsCountOfGuild( guild ) ,
			commandsUsedOfPreviousDays:
				this.getCommandsLaunchedOfPreviousDaysInGuild( guild ) ,
		}
	}

	getCreatedAtContent( guild ) {
		return `Сервер был создан ${ timestampToDate( Date.now() - guild.createdTimestamp , 3 ) } назад.`
	}

	async getGuildDescription( guild ) {
		const field = guildDataOf( guild ).description
		if ( !field ) {
			return 'Описание не установлено <a:who:638649997415677973>\n`!editServer` для настройки сервера'
		}
		const resolveTemplate = () => {
			return new Template( {
				empowered: client.users.resolve( field.authorId ) ,
				type: Template.sourceTypes.involuntarily ,
			} )
				.createVM()
				.run( field.content )
		}
		return field.isTemplate ? await resolveTemplate() : field.content
	}

	getUsedCommandsCountOfGuild( guild ) {
		return Object.values( guildDataOf( guild ).commandsUsed ).reduce(
			factorySummarize() ,
			0 ,
		)
	}

	async onChatInput( msg , interaction ) {
		const context = this.getContext( interaction )
		const { guild } = context

		const values = {
			stats: {
				msgs: `За сегодня: ${ guildDataOf( guild ).day_msg }` ,
				msgsAll: `Всего: ${ guildDataOf( guild ).day_msg + guildDataOf( guild ).msg_total }` ,
				around: `В среднем: ${ Math.round(
					( guildDataOf( guild ).day_msg + guildDataOf( guild ).msg_total ) / ( guildDataOf( guild ).days + 1 ) ,
				) }` ,
				record: `Рекорд: ${ ending(
					guildDataOf( guild ).day_max ,
					'сообщени' ,
					'й' ,
					'е' ,
					'я' ,
				) }\n` ,
				commands: `Использовано команд: ${ context.commandsUsed }` ,
				todayCommands: `Сегодня: ${
					context.commandsUsed - context.commandsUsedOfPreviousDays
				}` ,
			} ,
			members: {
				count: `Всего: ${ guild.memberCount }` ,
				online: `Онлайн: ${
					guild.members.cache.filter(
						member =>
							member.presence
							&& member.presence.status !== PresenceUpdateStatus.Offline ,
					).size
				}` ,
				offline: `Оффлайн: ${
					guild.members.cache.filter(
						member =>
							!member.presence
							|| member.presence.status === PresenceUpdateStatus.Offline ,
					).size
				}` ,
			} ,
			channels: {
				categories: `Категорий: ${
					guild.channels.cache.filter(
						$ => $.type === ChannelType.GuildCategory ,
					).size
				}` ,
				texted: `Текстовых: ${
					guild.channels.cache.filter( $ => $.isTextBased() ).size
				}` ,
				voices: `Голосовых: ${
					guild.channels.cache.filter( $ => $.isVoiceBased() ).size
				}` ,
			} ,
		}

		const stats = Object.values( values.stats ).join( '\n' )
		const members = Object.values( values.members ).join( '\n' )
		const channels = Object.values( values.channels ).join( '\n' )

		const verification = [
			'Отсуствует' ,
			'Низкий' ,
			'Средний' ,
			'Высокий' ,
			'Слишком высокий' ,
		]

		const fields = [
			{ name: 'Участники:' , value: members , inline: true } ,
			{ name: 'Каналы:' , value: channels , inline: true } ,
			{ name: '**Статистика сообщений:**' , value: stats } ,
			{
				name: '**Владелец:**' ,
				value: String( await guild.fetchOwner() ) ,
				inline: true ,
			} ,
			{
				name: '**Ур. Верификации:**' ,
				value: String( verification[ guild.verificationLevel ] ) ,
				inline: true ,
			} ,
		]
		const clover = this.getCloverData( guild )
		if ( clover ) {
			const { timeToEnd , multiplayer , cloverEffect } = clover
			const { coins , createdAt , uses } = cloverEffect

			fields.unshift( {
				name: '🍀 Действие Клевера' ,
				value: `Осталось времени: ${ +( timeToEnd / HOUR ).toFixed(
					1 ,
				) }ч.\nКлевер был запущен: <t:${ Math.floor(
					createdAt / SECOND ,
				) }>;\nНаград получено: ${ coins }\nТекущий множетель: X${ ( multiplayer + 1 ).toFixed( 2 ) }\nКуплено клеверов: ${ uses }` ,
			} )
		}

		interaction.channel.msg( {
			title: `${ guild.name } ${ randomElementFromArray( [ '❤️' , '🧡' , '💛' , '💚' , '💙' , '💜' ] ) }` ,
			thumbnail: guild.iconURL() ,
			description: await this.getGuildDescription( guild ) ,
			footer: {
				text: `${ this.getCreatedAtContent( guild ) }\nID: ${ guild.id }` ,
			} ,
			image: guildDataOf( guild ).banner ,
			fields ,
		} )
	}
}

export default Command
