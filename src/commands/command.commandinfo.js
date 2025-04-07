import { BaseCommand } from '#src/commands/BaseCommand/BaseCommand.js'
import { BaseCommandRunContext } from '#src/commands/CommandRunContext.js'
import CommandsManager , {
	resolve_command ,
} from '#src/commands/CommandsManager/singleton.js'
import { DataManager } from '#src/data/singleton.js'
import { permissionsBitsToI18nArray } from '#src/discord/permissions.js'
import { percent_string } from '#src/formatters/formatters.js'
import { resolveGithubPath } from '#src/github/resolveGithubPath.js'
import {
	guild_custom_commands_uses_count as custom_commands_guild_uses_count ,
	CustomCommand ,
	uses_count_of ,
} from '#src/guildcommand/command.guildcommand.js'
import { capitalize } from '#src/mini.js'
import { joinWithAndSeparator } from '#src/safe-utils.js'
import { justButtonComponents } from '@zoodogood/utils/discordjs'
import { CliParser } from '@zoodogood/utils/primitives'
import Discord from 'discord.js'
import { SECOND } from '../constants/time.js'

class CliFlagsField {
	constructor( context ) {
		this.context = context
	}

	flagToString( flag ) {
		const { capture , expectValue } = flag
		const isMultiple = capture.length > 1
		const toString = capture =>
			`\`${ expectValue ? `${ capture } {}` : capture }\``

		const content = capture.map( toString ).join( '|' )
		return isMultiple ? `[${ content }]` : content
	}

	processFlags() {
		const {
			targetCommand: { options } ,
		} = this.context
		const flags = options.cliParser?.flags
		if ( !flags ) {
			return
		}
		this.context.addableFields.push( {
			name: 'Флаги команды:' ,
			value: flags.map( flag => this.flagToString( flag ) ).join( ', ' ) ,
		} )
	}
}

class FlagsCommandManager {
	constructor( context ) {
		this.context = context
	}

	async onProcess( channel ) {
		const { context } = this
		const {
			meta: { options } ,
		} = this.context
		channel ||= context.channel
		const { name , cliParser } = options
		await this.sendFlags( channel , {
			commandName: name ,
			flags: cliParser?.flags ,
		} )
	}

	sendFlags( channel , { commandName , flags } ) {
		const description
			= flags
				?.map( ( flag ) => {
					const title = CliFlagsField.prototype.flagToString( flag )
					const { description , example } = flag
					return `- ${ title }\n${ example ? `✏️ ${ example }\n` : '' }${ description }`
				} )
				.join( '\n' ) || 'Здесь пусто..'
		channel.msg( { title: `Флаги команды ${ commandName }` , description } )
	}
}

class CommandRunContext extends BaseCommandRunContext {
	addableFields = []
	cliParsed
	meta
	targetCommand
	targetMessage

	static new( interaction , command ) {
		const context = new this( interaction , command )
		context.parseCli()
		context.processCommandInfo()
		if ( !context.meta ) {
			return context
		}
		context.processFlags()
		return context
	}

	parseCli() {
		const parser = ( new CliParser ).setText( this.interaction.params )

		const parsed = parser
			.processBrackets()
			.captureFlags( this.command.options.cliParser.flags )
			.captureResidueFlags()
			.captureByMatch( {
				name: 'commandRaw' ,
				regex: /[a-zа-яёї0-9]+/i ,
				valueOf: capture => capture?.toString().toLowerCase() ,
			} )
			.collect()

		const values = parsed.resolveValues( capture => capture?.toString() )
		this.setCliParsed( parsed , values )
	}

	processCommandInfo() {
		const values = this.cliParsed.at( 1 )
		const raw = values.get( 'commandRaw' )
		if ( !raw ) {
			return null
		}
		this.setTargetCommand( resolve_command( raw , this.interaction.guild ) )

		this.setCommandMeta(
			this.targetCommand ? TargetCommandMetadata.new( this ) : null ,
		)
		return this
	}

	processFlags() {
		const { meta } = this
		if ( !meta ) {
			return
		}
		new CliFlagsField( this ).processFlags()
	}

	setCommandMeta( meta ) {
		this.meta = meta
		return this
	}

	setTargetCommand( command ) {
		this.targetCommand = command
		return this
	}
}

class TargetCommandMetadata {
	static CategoriesEnum = {
		dev: 'Команда в разработке или доступна только разработчику' ,
		delete: 'Команда была удалена' ,
		guild: 'Управление сервером' ,
		user: 'Пользователи' ,
		bot: 'Бот' ,
		other: 'Другое' ,
		custom: 'Команда создана одним из пользователей сервера' ,
	}

	aliases
	category
	command
	commandNameId
	githubURL
	id
	media
	options
	usedCount
	get commandUsedTotally() {
		return this.calculateCommandsUsedTotally()
	}

	static new( context ) {
		const meta = ( new this )
		Object.assign(
			meta ,
			meta.fetchCommandMetadata( context.targetCommand , context.guild ) ,
		)
		return meta
	}

	calculateCommandsUsedTotally() {
		const used = Object.values( DataManager.data.bot.commandsUsed )
		return used.reduce( ( acc , count ) => acc + count , 0 )
	}

	fetchCommandMetadata( command , guild ) {
		const { options } = command
		const { id } = options
		const commandNameId = options.name
		const category = options.type
		const aliases = options.alias?.split( ' ' )
		const githubURL = this.resolveGithubPathOf( commandNameId )
		const media = options.media
		const usedCount
			= command instanceof CustomCommand
				? uses_count_of( commandNameId , guild )
				: DataManager.data.bot.commandsUsed[ command.options.id ] || 0

		return {
			options ,
			id ,
			category ,
			commandNameId ,
			aliases ,
			media ,
			usedCount ,
			githubURL ,
			command ,
		}
	}

	permissionsToLocaledArray( permissions , locale ) {
		const strings = permissionsBitsToI18nArray( permissions , locale )
		const formatted = strings.map( ( permission ) => {
			return permission.toLowerCase()
		} )

		return capitalize( joinWithAndSeparator( formatted ) )
	}

	resolveGithubPathOf( commandNameId ) {
		return resolveGithubPath(
			`./folder/entities/${ commandNameId }/command.${ commandNameId }.js` ,
		)
	}
}

class Command extends BaseCommand {
	static MESSAGE_THEME = {
		poster:
			'https://media.discordapp.net/attachments/629546680840093696/963343808886607922/disboard.jpg' ,
	}

	componentsCallbacks = {
		async display( { interaction , params } ) {
			const [ commandName ] = params
			interaction.params = commandName
			const context = await CommandRunContext.new( interaction , this )
			await this.processDefaultBehaviour( context )
		} ,
		async flags_of( { interaction , params } ) {
			const [ commandName ] = params
			interaction.params = `${ commandName } --flags`
			const context = await CommandRunContext.new( interaction , this )
			await new FlagsCommandManager( context ).onProcess( interaction )
		} ,
	}

	options = {
		name: 'commandinfo' ,
		id: 53 ,
		media: {
			description:
				'Показывает информацию об указанной команде, собственно, на её основе вы и видите это сообщение' ,
			example: `!commandInfo {command}` ,
		} ,
		cliParser: {
			flags: [
				{
					name: '--flags' ,
					capture: [ '-f' , '--flags' ] ,
					description: 'Отображает флаги целевой команды и их описания' ,
				} ,
			] ,
		} ,
		alias: 'command команда command_info' ,
		allowDM: true ,
		expectParams: true ,
		cooldown: 5 * SECOND ,
		type: 'bot' ,
	}

	formatMediaDescription( media ) {
		const { description , example } = media
		const exampleContent = `\n\n✏️\n\`\`\`python\n${ example }\n\`\`\``
		return `${ description ?? 'Описание для этой команды пока отсуствует...' }${ example ? exampleContent : '' }`
	}

	async onChatInput( msg , interaction ) {
		const context = await CommandRunContext.new( interaction , this )
		context.setWhenRunExecuted( this.run( context ) )
		return context
	}

	processCommandExists( context ) {
		const { targetCommand } = context

		if ( !targetCommand ) {
			this.sendHelpMessage( context )
			return
		}

		return true
	}

	async processDefaultBehaviour( context ) {
		const { meta , user , interaction } = context
		const { guild } = interaction
		const {
			aliases ,
			commandNameId ,
			media ,
			usedCount ,
			githubURL ,
			id ,
			category ,
			commandUsedTotally ,
			command ,
		} = meta

		const locale = user.data.locale

		const embed = {
			title: `— ${ commandNameId.toUpperCase() }` ,
			description: this.formatMediaDescription( media ).trim() ,
			color: '#1f2022' ,
			image: media.poster || Command.MESSAGE_THEME.poster ,
			fields: [
				{
					name: 'Другие способы вызова:' ,
					value: Discord.escapeMarkdown(
						aliases?.map( name => `!${ name }` ).join( ' ' ) || 'Нет' ,
					) ,
				} ,
				{
					name: 'Категория:' ,
					value: `${ TargetCommandMetadata.CategoriesEnum[ category ] }${ ( () => {
						if ( context.targetCommand instanceof CustomCommand ) {
							return `\n-# !guildcommand --target ${ commandNameId }`
						}
						return githubURL ? `\n[Просмотреть в Github ~](${ githubURL })` : ''
					} )() }` ,
				} ,
				{
					name: 'Необходимые права' ,
					value:
						meta.permissionsToLocaledArray( meta.userPermissions , locale )
						|| 'Нет' ,
				} ,
				{
					name: 'Количество использований' ,
					value: `${ usedCount } (${
						[
							percent_string( usedCount / commandUsedTotally ) ,
							command instanceof CustomCommand
							&& percent_string(
								usedCount / custom_commands_guild_uses_count( guild ) ,
							) ,
						]
							.filter( Boolean )
							.join( '/' )
							|| 'Хотя бы одно использование, чтобы увидеть статистику'
					})` ,
				} ,
				... context.addableFields ,
			] ,
			footer: {
				text: `Уникальный идентификатор команды: ${ id || 'необычная' }` ,
			} ,
			components: justButtonComponents(
				... [
					context.addableFields.length && {
						label: 'Показать флаги' ,
						customId: `@command/commandinfo/flags_of:${ commandNameId }` ,
					} ,
				].filter( Boolean ) ,
			) ,
		}
		const message = await interaction.msg( embed )
		context.targetMessage = message
		return true
	}

	async processFlagsFlag( context ) {
		const values = context.cliParsed.at( 1 )
		if ( !values.get( '--flags' ) ) {
			return
		}
		await new FlagsCommandManager( context ).onProcess()
		return true
	}

	async run( context ) {
		if ( !( await this.processCommandExists( context ) ) ) {
			return
		}
		if ( await this.processFlagsFlag( context ) ) {
			return
		}
		return await this.processDefaultBehaviour( context )
	}

	async sendHelpMessage( context ) {
		const { interaction } = context
		const { channel , user } = interaction
		const helpMessage = await channel.msg( {
			title: 'Не удалось найти команду' ,
			description: `Не существует вызова \`!${ interaction.params }\`\nВоспользуйтесь командой !хелп или нажмите реакцию ниже для получения списка команд.\nНа сервере бота Вы можете предложить псевдонимы для вызова одной из существующих команд.` ,
		} )
		const react = await helpMessage.awaitReact(
			{ user , removeType: 'all' } ,
			'❓' ,
		)
		if ( !react ) {
			return
		}

		await (
			await CommandsManager.commandInstance( 'help' )
		).onChatInput( interaction.message , interaction )
	}
}

export default Command
