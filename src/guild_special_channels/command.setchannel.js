import {
	BaseCommand ,
	BaseFlagSubcommand ,
} from '#src/commands/BaseCommand/BaseCommand.js'
import { BaseCommandRunContext } from '#src/commands/CommandRunContext.js'
import { PermissionsBits } from '#src/discord/permissions.js'
import { question } from '#src/discord/utils.js'
import { Emoji } from '#src/emojis/emojis.js'
import { createCollectionWithKey } from '#src/nodejs/Collection/create.js'
import { CliParser } from '@zoodogood/utils/CliParser'
import {
	justButtonComponents ,
	justSelectMenuComponent ,
} from '@zoodogood/utils/discordjs'
import { DotNotatedInterface } from '@zoodogood/utils/objectives'
import { sendToLogsChannel , SpecialChannel } from './special_channel_enum.js'
import { guildDataOf } from '#src/data/singleton.js'

const SpecialChannelExtend = createCollectionWithKey( [
	{
		key: 'chatChannel' ,
		congratulations: channel => `#${ channel.name } стал чатом!` ,
		onDisableMessage: () => 'Отправляемые в чат уведомления откючены' ,
	} ,
	{
		key: 'logChannel' ,
		congratulations: channel =>
			`Готово, в #${ channel.name } будут отправляться логи сервера!` ,
		onDisableMessage: () => 'Логи отключены' ,
	} ,
	{
		key: 'hi.channel' ,
		congratulations: channel =>
			`#${ channel.name } установлен как целевой канал функционала !welcomer` ,
		onDisableMessage: () => 'Функция приветствия новых участников отлючена' ,
	} ,
] )

class CommandRunContext extends BaseCommandRunContext {
	_specialChannelType = null

	parseCli( input ) {
		const parsed = ( new CliParser )
			.setText( input )
			.captureFlags( this.command.options.cliParser.flags )
			.collect()
		const values = parsed.resolveValues( capture => capture?.toString() )
		this.setCliParsed( parsed , values )
		return parsed
	}

	async specialChannelType() {
		return ( this._specialChannelType ||= await ( async () => {
			const { commandBase } = this.interaction
			switch ( true ) {
			case [ 'чат' , 'chat' ].some( pattern => commandBase.includes( pattern ) ):
				return 'chatChannel'

			case [ 'log' , 'лог' ].some( pattern => commandBase.includes( pattern ) ):
				return 'logChannel'

			case [ 'hi' , 'welcome' , 'приветствие' , 'привітання' ].some( pattern =>
				commandBase.includes( pattern ) ,
			):
				return 'hi.channel'

			default: {
				const { channel , user } = this.interaction
				const { value: component_interaction } = await question( {
					channel ,
					user ,
					messageOptions: {
						disable: true ,
					} ,
					message: {
						components: justButtonComponents(
							justSelectMenuComponent( {
								labels: Array.from(
									SpecialChannel.values() ,
									( { label } ) => label ,
								) ,
							} ) ,
						) ,
					} ,
					listen_components: true ,
				} )
				if ( !component_interaction ) {
					return null
				}
				const [ index ] = component_interaction.values
				return SpecialChannel.keyAt( index )
			}
			}
		} )() )
	}
}

class CommandDefaultBehaviour extends BaseFlagSubcommand {
	async onProcess() {
		const { interaction , user , guild } = this.context
		const { mentions } = interaction.message
		const key = await this.context.specialChannelType()
		if ( !key ) {
			return
		}
		const channel = mentions.channels.first() ?? interaction.channel

		new DotNotatedInterface( guildDataOf( guild ) ).setItem( key , channel.id )
		interaction.msg( {
			title: SpecialChannelExtend.get( key ).congratulations( channel ) ,
		} )
		sendToLogsChannel( guild , {
			description: `Каналу #${ channel.name } установили метку «${ SpecialChannel.get( key ).label }»` ,
			author: { name: user.username , avatarURL: user.avatarURL() } ,
		} )
	}
}

class Remove_FlagSubcommand extends BaseFlagSubcommand {
	static FLAG_DATA = {
		name: '--remove' ,
		capture: [ '--remove' ] ,
	}

	async onProcess() {
		const { guild , interaction } = this.context
		const key = await this.context.specialChannelType()
		if ( !key ) {
			return
		}
		await sendToLogsChannel( guild , {
			description: SpecialChannelExtend.get( key ).onDisableMessage() ,
			author: {
				name: interaction.user.username ,
				avatarURL: interaction.user.avatarURL() ,
			} ,
		} )
		interaction.message.react( Emoji.animation_tick_block )
		new DotNotatedInterface( guildDataOf( guild ) ).setItem( key , undefined )
		interaction.msg( {
			title: `«${ SpecialChannel.get( key ).label }» канал отключен!` ,
		} )
	}
}
class Command extends BaseCommand {
	options = {
		name: 'setchannel' ,
		id: 11 ,
		media: {
			description:
				'Устанавливает для бота указанный канал, как чат, туда будет отправляться ежедневная статистика, а также не будут удалятся сообщения о повышении уровня.' ,
			example: `!setChan <channel>` ,
		} ,
		cliParser: {
			flags: [ Remove_FlagSubcommand.FLAG_DATA ] ,
		} ,
		alias:
			'setchan setchat установитьчат встановитичат setlogs установитьлоги встановитилоги встановитипривітання установитьприветствие' ,
		allowDM: true ,
		type: 'guild' ,
		userPermissions: PermissionsBits.ManageGuild ,
	}

	async onChatInput( msg , interaction ) {
		const context = new CommandRunContext( interaction , this )
		context.setWhenRunExecuted( this.run( context ) )
		return context
	}

	processRemoveFlag( context ) {
		const value = context.cliParsed.at( 1 ).get( '--remove' )
		if ( !value ) {
			return false
		}
		new Remove_FlagSubcommand( context ).onProcess()
		return true
	}

	async run( context ) {
		context.parseCli( context.interaction.params )
		if ( await this.processRemoveFlag( context ) ) {
			return
		}
		await new CommandDefaultBehaviour( context ).onProcess()
	}
}

export default Command
