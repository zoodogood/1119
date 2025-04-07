import config from '#config'
import client from '#src/bot/client/singleton.js'

import { DataManager } from '#src/data/singleton.js'

import { dayjs } from '#src/dayjs.js'
import EventsManager from '#src/events/EventsManager.js'
import { sendToLogsChannel } from '#src/guild_special_channels/special_channel_enum.js'

import { timestampToDate } from '#src/safe-utils.js'
import ActionManager , { Actions } from '#src/user/actions/ActionManager.js'
import { ActivityType , AuditLogEvent } from 'discord.js'
import { guildsOfUser } from './discord/utils.js'
import '#src/_expand_prototype.js'
import '#src/app/BaseContext/toSafeValues/_expand_prototype.js'
import '#src/nodejs/polifiles.js'
import 'dotenv/config'

console.clear()

client.on( 'ready' , async () => {
	for ( const guild of client.guilds.cache.values() ) {
		const invites = await guild.invites.fetch().catch( () => {} )
		if ( !invites ) {
			continue
		}
		guild.invitesUsesCache = invites.mapValues( invite => invite.uses )
	}

	if ( config.development ) {
		client.user?.setActivity( 'Кабзец тебе, Хозяин' , {
			type: ActivityType.Streaming ,
			url: 'https://www.twitch.tv/monstercat' ,
		} )
	} else {
		client.user?.setActivity( 'намана' , {
			type: ActivityType.Watching ,
		} )
	}

	// ----------------------------------{Events and intervals--}------------------------------                            #0bf

	client.on( 'inviteCreate' , async ( invite ) => {
		const { guild } = invite
		guild.invitesUsesCache?.set( invite.code , invite.uses )
	} )

	client.on( 'guildCreate' , async ( guild ) => {
		const members = guild.members.cache.filter( e => !e.user.bot )
		let whoAdded = await guild.Audit( log => log.target.id === client.user.id , {
			type: AuditLogEvent.BotAdd ,
		} )
		whoAdded = whoAdded ? whoAdded.target : null

		const developerChat = client.channels.cache.get( config.guild.logChannelId )
		if ( developerChat ) {
			const title = `Бот присоеденился к серверу ${ guild.name }!`
			const description = `Участников: ${
				members.size
			}\nКол-во знакомых боту людей: ${
				members.filter( member =>
					DataManager.data.users.some( user => user.id === member.id ) ,
				).size
			}\nПригласил пользователь этого сервера?: ${
				whoAdded && guild.members.resolve( whoAdded ) ? 'Да' : 'Нет'
			}.`
			developerChat.msg( {
				title ,
				description ,
				footer: { text: `Серверов: ${ client.guilds.cache.size }` } ,
			} )
		}

		guild.invitesUsesCache = ( await guild.invites.fetch() ).mapValues(
			invite => invite.uses ,
		)
		DataManager.data.bot.addToNewGuildAt = Date.now()
	} )

	client.on( 'guildDelete' , async ( guild ) => {
		client.users.cache
			.get( '921403577539387454' )
			.msg( { title: `Бота забанили на сервере ${ guild.name }!` } )
	} )

	client.on( 'messageReactionAdd' , async ( reaction , user ) => {
		if ( reaction.emoji.name === '👍' ) {
			const target = ( await reaction.message.fetch( { force: false } ) ).author

			user.action( Actions.likedTheUser , {
				target ,
				likeType: 'reaction' ,
				reaction ,
			} )
		}
	} )

	client.on( 'guildMemberRemove' , async ( member ) => {
		const { guild } = member
		if ( !guild.data.members ) {
			member.guild.data.members = {}
		}
		const memberData = ( guild.data.members[ member.id ] ||= {} )
		memberData.leave_roles = Array.from( member.roles.cache.keys() )

		const banInfo
			= ( await guild.Audit( audit => audit.target.id === member.id , {
				limit: 50 ,
				type: AuditLogEvent.MemberBanAdd ,
			} ) )
			|| ( await guild.Audit( audit => audit.target.id === member.id , {
				limit: 50 ,
				type: AuditLogEvent.MemberKick ,
			} ) )
		const reason = () => ( banInfo.reason ? `\nПричина: ${ banInfo.reason }` : '' )

		const name = `Имя: ${ member.user.tag }${ member.user.bot ? ' BOT' : '' }`

		const message = banInfo
			? {
				content: `Участник был ${
					banInfo.action === AuditLogEvent.MemberKick ? 'кикнут' : 'забанен'
				}` ,
				description: `${ name }\nВыгнавший с сервера: ${
					guild.members.resolve( banInfo.executor ).displayName
				} ${ reason().slice( 0 , 1000 ) }` ,
			}
			: {
				content: 'Участник покинул сервер' ,
				description: `${ name }\nНадеемся, он скоро вернётся` ,
			}

		sendToLogsChannel( guild , {
			title: message.content ,
			description: message.description ,
			color: banInfo ? '#ff0000' : '#00ff00' ,
		} )
	} )

	client.on( 'userUpdate' , async ( old , user ) => {
		if ( old.avatar === user.avatar ) {
			return
		}

		guildsOfUser( user ).forEach( guild =>
			sendToLogsChannel( guild , {
				title: `${ guild.members.resolve( user ).displayName } изменил свой аватар` ,
				author: {
					name: user.username ,
					iconURL: user.avatarURL( { dynamic: true } ) ,
				} ,
				description: '' ,
				footer: {
					text: 'Старый аватар' ,
					iconURL: old.displayAvatarURL( { dynamic: true } ) ,
				} ,
			} ) ,
		)
	} )
} )

// ---------------------------------{#Objects--}------------------------------

DataManager.extendsGlobalPrototypes()
ActionManager.extendsGlobalPrototypes();

( async () => {
	( await EventsManager.importEvents() ).listen( 'core/start' )
	EventsManager.emitter.emit( 'start' )

	await import( './http_requests/server_singleton.js' )
} )()

// ---------------------------------{#End--}------------------------------                            #ff0

/*
ᅠᅠ💢
──────▄▀▄─────▄▀▄
─────▄█░░▀▀▀▀▀░░█▄
─▄▄──█░░░░░░░░░░░█──▄▄
█▄▄█─█░░▀░░┬░░▀░░█─█▄▄█
**
Have a nice day!
**
●▬▬▬▬▬▬ஜ۩۞۩ஜ▬▬▬▬▬●
*/

console.info(
	timestampToDate(
		( dayjs().hour() < 20 ? dayjs() : dayjs().add( 1 , 'day' ) )
			.set( 'hour' , 20 )
			.set( 'minute' , 0 )
			.set( 'second' , 0 )
			.diff() ,
	) ,
)
