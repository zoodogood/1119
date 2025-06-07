import { code } from '#constants/status_codes.js'
import { MINUTE , SECOND } from '#constants/time.js'

import { mol_tree2_string_from_json } from '#src/$mol.js'
import { BaseContext } from '#src/app/BaseContext/BaseContext.js'
import client from '#src/bot/client/singleton.js'
import {
	BaseCommand ,
	BaseFlagSubcommand ,
} from '#src/commands/BaseCommand/BaseCommand.js'
import {
	cli_parser_parse_flags ,
	flag ,
	process_flags ,
} from '#src/commands/BaseCommand/parse_flags.js'
import { BaseCommandRunContext } from '#src/commands/CommandRunContext.js'

import CooldownManager from '#src/CooldownManager.js'
import { guildDataOf , singletonBotData , store , userDataOf } from '#src/data/singleton.js'
import { MessageInterface } from '#src/discord/MessageInterface.js'
import { Pager } from '#src/discord/Pager.js'
import { PermissionsBits } from '#src/discord/permissions.js'
import {
	awaitUserAccept ,
	question ,
	take_missing_permissions ,
	takeInteractionProperties ,
} from '#src/discord/utils.js'
import { Emoji } from '#src/emojis/emojis.js'
import { crop_string } from '#src/formatters/formatters.js'
import { ParserTime } from '#src/user_input_prepare/parsers.js'
import Template from '#src/VirtualMachine/Template.js'
import { justButtonComponents } from '@zoodogood/utils/discordjs'
import { escapeCodeBlock , escapeMarkdown } from 'discord.js'

export function uses_count_of( custom_command_name , guild ) {
	return Object.values(
		guildDataOf( guild ).custom_commands[ custom_command_name ].members || {} ,
	).reduce( ( acc , [ uses ] ) => acc + uses , 0 )
}

export function guild_custom_commands_uses_count( guild ) {
	return Object.values( guildDataOf( guild ).custom_commands ).reduce(
		( acc , custom_command ) => acc + uses_count_of( custom_command.name , guild ) ,
		0 ,
	)
}
// MARK: CmdInstance
export class CustomCommand extends BaseCommand {
	get empowered() {
		return client.users.resolve( this.empoweredId )
	}

	constructor( custom_command , guild ) {
		super()
		this.empoweredId = custom_command.empoweredId
		this.custom_command = custom_command
		this.source_guild = guild
		this.options = {
			name: custom_command.name ,
			type: 'custom' ,
			media: {
				description: custom_command.description ,
			} ,
		}
	}

	_cooldown_api( context ) {
		const { interaction } = context
		const { options } = this
		const command_field = this.command_field()
		command_field.members ||= []
		const target = ( command_field.members[ interaction.user.id ] ||= [ 0 , 0 ] )
		const INDEX_OF_COOLDOWN = '1'
		return CooldownManager.api( target , INDEX_OF_COOLDOWN , {
			heat: options.cooldownTry ?? 1 ,
			perCall: options.cooldown ,
		} )
	}

	_statistic_increase( context ) {
		{
			const { interaction } = context
			const command_field = this.command_field()
			command_field.members ||= []
			const target = ( command_field.members[ interaction.user.id ] ||= [ 0 , 0 ] )
			const INDEX_OF_COOLDOWN = '0'

			target[ INDEX_OF_COOLDOWN ]++
		}
		{
			const botData = singletonBotData()
			botData.commandsUsedToday ||= 0
			botData.commandsUsedToday++
		}
	}

	command_field() {
		return guildDataOf( this.source_guild ).custom_commands[ this.custom_command.name ]
	}

	// like eval format_object function
	format_object( object ) {
		if ( typeof object !== 'object' ) {
			return String( object )
		}

		object.toString !== Object.prototype.toString
		&& Object.defineProperty( object , 'toString' , {
			enumerable: false ,
			value: Object.prototype.toString ,
		} )

		return `\`\`\`tree\n${ escapeCodeBlock( mol_tree2_string_from_json( object ) ) }\`\`\``
	}

	async onChatInput( msg , interaction ) {
		const { user } = interaction
		const source = {
			empowered: this.empowered ,
			type: Template.sourceTypes.custom_command ,
		}
		const output = await new Template(
			source ,
			new BaseContext( 'guildcommand.onChatInput' , {
				... takeInteractionProperties( interaction ) ,
				primary: interaction ,
				executor: user ,
			} ) ,
		)
			.createVM()
			.run( this.custom_command.template || `"Привет! Попробуй !eval m'help"` )

		interaction.msg( { content: this.format_object( output ) } )
	}
}

// MARK: CreateCmd
class FactoryView extends BaseFlagSubcommand {
	command_name = null
	command_target = {}
	component_actions = {
		SwapBoolean() {} ,
		ApplyString() {} ,
	}

	pager = ( new Pager )
	pages_fields = [
		{
			label: 'Шаг первый (обязательный). Укажите уникальное название команды' ,
			key: 'name' ,
			description:
				'Название, которое отражает суть, будет более понятным для пользователей' ,
			type: String ,
			type_hint: '^[a-zа-яёї0-9_]+$' ,
			validation: value => /^!?[a-zа-яёї0-9_]+$/.test( value.content ) ,
			validation_hint_on_fail:
				'Название команды не удовлетворяет паттерну — дословно последовательности символов допускающей символы от «a» до «z» ∪ «а–я» (плюс ёъ) ∪ 0–9 ∪ «\\_», где «^» и «$» — обозначают начало и конец строки' ,
			callback: ( name ) => {
				name.startsWith( '!' ) && ( name = name.slice( 1 ) )
				const previous = this.wire.value[ name ]
				if (
					previous
					&& !this.command_is_allow_rewrite(
						this.wire.value[ name ] ,
						this.command_target ,
					)
				) {
					this.context.channel.msg( {
						description: `Такая команда уже существует и находится под управлением другого пользователя ${ client.users.resolve( previous.command_author_id ) }` ,
					} )
					return code.PermissionDenide
				}
				this.command_author_id = this.context.user.id
				this.command_target = this.command_resolve_or_init( name , {
					... this.command_target ,
				} )
				this.command_name = name
			} ,
			default: () => this.command_name || null ,
			required: true ,
		} ,
		{
			label: 'Шаг второй. Вызываемое JavaScript выражение' ,
			key: 'template' ,
			description:
				'Название, которое отражает суть, будет более понятным для пользователей' ,
			type: String ,
			callback: () => {
				this.command_target.empoweredId = this.context.user.id
			} ,
			required: true ,
		} ,
		{
			label: 'Вы можете добавить описание' ,
			key: 'description' ,
			description:
				'Пользователи смогут узнать как пользоваться вашей командой через !commandinfo' ,
			default: () => 'Для этой пользовательской команды не назначено описания' ,
			type: String ,
		} ,
		{
			label: 'Перезарядка' ,
			key: 'cooldown' ,
			description:
				'Ограничивает как часто пользователи могут применять команду. Второй параметр «накоплений» соотвествует стандартному поведению во многих командах бота, разрешая использовать команду несколько раз подряд, но перезарядка накапливается' ,
			type_hint: 'Время и через пробел число' ,
			validation: message =>
				new RegExp( `${ ParserTime.regex.source }` ).test( message.content ) ,
			validation_error: `Ожидалось время и через пробел число` ,
			type: String ,
			default: () => '5с 1' ,
		} ,
		{
			label: 'Отображать внутри !help' ,
			key: 'hidden' ,
			description:
				'По умолчанию все пользовательские команды можно посмотреть в !help' ,
			type: Boolean ,
			default: () => false ,
			modify_button_emoji: '🔁' ,
		} ,
	]

	pages_system = [
		{
			label: 'Навигация (вы здесь)' ,
			callback: () => ( {
				title: 'Навигация' ,
				fetchReply: true ,
				description: [ ... this.pages_system , ... this.pages_fields ]
					.map(
						( page , i ) =>
							`- ${ i + 1 }. ${ page.label }${ page.key && this.command_target[ page.key ] ? `. ${ Emoji.animation_tick_block } \`${ crop_string( String( this.command_target[ page.key ] ) , 20 ) }\`` : '' }` ,
					)
					.join( '\n' ) ,
			} ) ,
		} ,
	]

	command_get_field_value( field_base ) {
		return (
			( this.command_target[ field_base.key ] || field_base.default?.() ) ?? 'нет'
		)
	}

	command_is_allow_rewrite( original , rewrite ) {
		return original.command_author_id === rewrite.command_author_id
	}

	command_resolve_or_init( name , source = {} ) {
		return ( this.wire.value[ name ] ||= {
			... source ,
			name ,
		} )
	}

	modify_button_emoji() {
		return this.pages_current_page_is_system()
			? '🔒'
			: this.pages_resolve_field_page( this.pager.currentPage )
				?.modify_button_emoji || '🔧'
	}

	modify_button_is_disabled() {
		return this.pages_current_page_is_system()
	}

	async modify_button_process( interaction ) {
		if ( interaction.customId !== 'modify' ) {
			return false
		}
		const { currentPage } = this.pager
		const field_base = this.pages_resolve_field_page( currentPage )
		const description_base = () =>
			`Ожидается новое значение типа ${ field_base.type.name }${ field_base.type_hint ? ` \`(${ field_base.type_hint })\`` : '' }`
		const base_question = {
			validation_hint_on_fail: field_base.validation_hint_on_fail ,
			validation: field_base.validation ,
			channel: interaction ,
			listen_components: true ,
			user: interaction.user ,
			message: {
				description: description_base() ,
				fetchReply: true ,
			} ,
		}

		const value = await ( async () => {
			switch ( field_base.type ) {
			case String: {
				const { content } = await question( {
					... base_question ,
				} )
				return content
			}

			case Boolean: {
				const { isComponent , value } = await question( {
					... base_question ,
					message: {
						components: justButtonComponents( {} ) ,
					} ,
				} )
				return value
			}

			default:
				throw new TypeError( 'Unknown type' )
			}
		} )()

		if ( !value ) {
			return true
		}

		const response = await field_base.callback?.( value )

		this.command_target[ field_base.key ] = value
		this.wire.publish()
		return true
	}

	async onCollect( { interaction } ) {
		return await this.modify_button_process( interaction )
	}

	async onProcess() {
		this.wire_bind_from( this.context )
		if ( !this.view_permissions_process() ) {
			return
		}
		this.pager_setup()
		this.pager.updateMessage()
	}

	pager_setup() {
		const { pager , context } = this
		this.pager_setup_recalculate_pages()
		pager.setChannel( context.interaction )
		pager.currentPage = context.startup_page || 0
		pager.setUser( context.user )
		pager.setRender( () => this.render_get_embed() )
		pager.spliceComponents(
			-1 ,
			0 ,
			( () => {
				const [ component ] = justButtonComponents( {
					customId: 'modify' ,
				} )
				Object.defineProperties( component , {
					disabled: {
						get: () => {
							return this.modify_button_is_disabled()
						} ,
						enumerable: true ,
					} ,
					emoji: {
						get: () => {
							return this.modify_button_emoji()
						} ,
						enumerable: true ,
					} ,
				} )

				return [ component ]
			} )() ,
		)
		pager.emitter.on( Pager.Events.allowed_collect , this.onCollect.bind( this ) )
		{
			const disposable = this.wire.subscribe( () => pager.updateMessage() )
			pager.emitter.on( Pager.Events.before_close , () => disposable() )
		}
	}

	pager_setup_recalculate_pages() {
		return this.pager.setPagesLength(
			this.pages_fields.length + this.pages_system.length ,
		)
	}

	pages_current_page_is_system() {
		const { currentPage } = this.pager
		return currentPage < this.pages_system.length
	}

	pages_resolve_field_page( currentPage ) {
		const { pages_system } = this
		return this.pages_fields[ currentPage - pages_system.length ]
	}

	async render_get_embed() {
		const { pages_system } = this
		const { currentPage } = this.pager
		if ( this.pages_current_page_is_system() ) {
			return pages_system[ currentPage ].callback.call( this )
		}
		const field_base = this.pages_resolve_field_page( currentPage )

		return {
			fetchReply: true ,
			description: `${ Math.random() }\n### ${ field_base.label }\n\n-# ${ field_base.description }\n\nТекущее значение: ${ this.command_get_field_value( field_base ) }\n\n${ this.modify_button_emoji() } — поменять значение` ,
			footer: {
				text: `Параметр: ${ field_base.key } | !${ this.command_name || '<ред._команда>' }` ,
			} ,
		}
	}

	view_permissions_process() {
		const { context } = this
		const {
			interaction: { user , guild } ,
		} = context
		const member = guild.members.resolve( user )
		const missing = take_missing_permissions(
			member ,
			PermissionsBits.ManageGuild ,
		)
		if ( missing.length > 0 ) {
			context.interaction.msg( {
				content: 'Необходимо право: управление сервером' ,
				reference: context.interaction.message?.id ,
			} )
			return false
		}
		return true
	}

	wire_bind_from( context ) {
		return ( this.wire = CommandRunContext.prototype.wire.call( context ) )
	}
}

// MARK: GeneralView
class DefaultView extends BaseFlagSubcommand {
	_interface = ( new MessageInterface )
	async getEmbed() {
		const { length: commands_count } = Object.keys( this.context.wire().value )
		return {
			title: 'Список команд' ,
			components: justButtonComponents(
				... [
					commands_count < 3 && {
						label: 'Создать' ,
						customId: '@command/guildcommand/create' ,
					} ,
					commands_count > 0 && {
						label: 'Настроить' ,
						customId: '@command/guildcommand/edit' ,
					} ,
					commands_count > 0 && {
						label: 'Удалить' ,
						customId: '@command/guildcommand/remove' ,
					} ,
				].filter( Boolean ) ,
			) ,
			description:
				`===============================================\n${
					Object.keys( this.context.wire().value )
						.map( ( name ) => {
							return `- ${ name }`
						} )
						.join( '\n' ) || 'Команд нет'
				}\n===============================================` ,
			footer: {
				text: 'Оптимальный способ вызова редактирования команды: !custom --target <command_name>' ,
			} ,
		}
	}

	async onProcess() {
		const { interaction } = this.context

		this._interface.setChannel( interaction.channel )
		this._interface.setRender( async () => await this.getEmbed() )
		this._interface.updateMessage()
	}
}
class CommandDefaultBehaviour extends BaseFlagSubcommand {
	async onProcess() {
		const { context } = this
		const wire = context.wire()
		const view = new DefaultView( context )
		await view.onProcess()
		const disposable = wire.subscribe( () => view._interface.updateMessage() )
		view._interface.emitter.on( MessageInterface.Events.before_close , () =>
			disposable() )
	}
}

// MARK: Context
class CommandRunContext extends BaseCommandRunContext {
	startup_page = 0
	wire() {
		guildDataOf(	this.guild ).custom_commands ||= {}
		const wire = store.hold_wire( guildDataOf( this.guild ) , 'custom_commands' )
		return wire
	}
}
// MARK: Command
class Command extends BaseCommand {
	componentsCallbacks = {
		create: ( context ) => {
			new FactoryView( context ).onProcess()
		} ,
		edit: async ( context ) => {
			const view = new FactoryView( context )
			const wire = view.wire_bind_from( context )
			await question( {
				channel: context.interaction ,
				message: {
					description: 'Укажите номер или название команды для редактирования' ,
					fetchReply: true ,
				} ,
				user: context.interaction.user ,
				validation: ( { content } ) => {
					return false
				} ,
				validation_hint_on_fail: `Команда не найдена, попробуйте указать число до ${
					Object.keys( wire.value ).length
				}` ,
			} )
		} ,
		/**
		 *
		 * @param {CommandRunContext} context
		 */
		remove: async ( context ) => {
			const { interaction } = context
			const { channel , user } = interaction
			const wire = CommandRunContext.prototype.wire.call( context )

			const _interface = new MessageInterface( interaction )
			_interface.setRender( () => {
				const names = Object.keys( wire.value )
				if ( !names.length ) {
					setTimeout( () => _interface.close() , 5 * SECOND )
				}
				return {
					title: names.length
						? 'Отправьте номер команды, которую хотите удалить'
						: 'Это окно сейчас закроется' ,
					fetchReply: true ,
					description:
						names
							.map( ( name , i ) => {
								return `-# \`#${ i + 1 }\` — **${ escapeMarkdown( name ) }**`
							} )
							.join( '\n' ) || 'Команд нет' ,
				}
			} )
			_interface.updateMessage()
			const disposable = wire.subscribe( () => _interface.updateMessage() )
			_interface.emitter.on( MessageInterface.Events.before_close , () =>
				disposable() )

			const answer = (
				await channel.awaitMessages( {
					max: 1 ,
					filter: message => message.author.id === user.id ,
					time: MINUTE ,
				} )
			)?.first()

			const { content: index } = answer
			answer.delete()
			_interface.close()
			const names = Object.keys( wire.value )

			const by_name = names[ index - 1 ]
			if ( !by_name ) {
				interaction.channel.msg( {
					color: '#ff0000' ,
					title: 'Команда не найдена' ,
					delete: 8_000 ,
				} )
				return
			}
			delete wire.value[ by_name ]
			wire.publish()

			interaction.channel.msg( {
				title: 'Удаление' ,
				description: `Удалена команда ${ by_name }. Нажмите реакцию, чтобы вернуть` ,
				delete: 8_000 ,
			} )
		} ,
	}

	options = {
		name: 'guildcommand' ,
		id: 36 ,
		media: {
			description:
				'Создание пользовательских команд на сервере — ещё один этап к многофункциональной системе шаблонов и переменных сервера, обязательно комбинируйте эти технологии\n_устарело*_' ,
			example: `!guildCommand #без аргументов` ,
		} ,
		alias:
			'guildcommands createcommand командасерверу командасервера customcommand custom' ,
		cliParser: {
			flags: [
				flag( [ '--target' , '-t' ] , 'Начать редактирование команды по имени' , {
					expectValue: true ,
					async finalize( context , { value: command_name } ) {
						console.log( { command_name } )
						if ( !command_name ) {
							return false
						}
						if ( !command_name ) {
							context.channel.msg( {
								color: '#ff0000' ,
								title: 'Необходимо указать имя команды' ,
								delete: 9 * SECOND ,
							} )
							return true
						}
						const view = new FactoryView( context )
						view.wire_bind_from( context )
						view.command_target = view.command_resolve_or_init( command_name )
						view.command_name = command_name
						await view.onProcess()
						return true
					} ,
				} ) ,
				flag( [ '--page' , '-p' ] , 'Начать с заданной страницы, если применимо' , {
					expectValue: true ,
					effect( context , { value } ) {
						context.startup_page = Number( value ) || 0
					} ,
				} ) ,
			] ,
		} ,
		type: 'guild' ,
	}

	async onChatInput( msg , interaction ) {
		const context = await CommandRunContext.new( interaction , this )
		context.setWhenRunExecuted( this.run( context ) )
		return context
	}

	/**
	 *
	 * @param {CommandRunContexts} context
	 */
	async run( context ) {
		const { channel , user } = context
		const heAccpet = await awaitUserAccept( {
			name: 'guildCommand' ,
			message: {
				description:
					'Здравствуйте, эта команда очень универсальна и проста, если её не боятся конечно. Она поможет вам создать свои собсвенные команды основанные на "[Шаблонных строках](https://discord.gg/7ATCf8jJF2)".\nЕсли у вас возникнут сложности, обращайтесь :)' ,
				title: 'Команда для создания команд 🤔' ,
			} ,
			channel ,
			userData: userDataOf( user ) ,
		} )
		if ( !heAccpet )
			return

		cli_parser_parse_flags( this , context )

		if ( await process_flags( context ) ) {
			return
		}

		await new CommandDefaultBehaviour( context ).onProcess()
	}
}

export default Command
