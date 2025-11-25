import { NULL_WIDTH_SPACE } from '#constants/characters.js'
import { MINUTE , SECOND } from '#constants/time.js'
import { BoardFactory } from '#src/board/Board/Board.js'
import { render_strategies } from '#src/board/Board/render/strategies/mod.js'
import {
	BaseCommand ,
	BaseFlagSubcommand ,
} from '#src/commands/BaseCommand/BaseCommand.js'
import { BaseCommandRunContext } from '#src/commands/CommandRunContext.js'
import CommandsManager from '#src/commands/CommandsManager/singleton.js'
import { MessageInterface } from '#src/discord/MessageInterface.js'
import { PermissionsBits } from '#src/discord/permissions.js'
import { disposableListen } from '#src/EventEmitter/export.js'
import { capitalize } from '#src/mini.js'
import { codeOfEmoji , justButtonComponents } from '@zoodogood/utils/discordjs'
import { ButtonStyle , ComponentType , escapeMarkdown } from 'discord.js'

class CommandRunContext extends BaseCommandRunContext {}

class Create_FlagSubcommand extends BaseFlagSubcommand {
	_interface = ( new MessageInterface )
	board = {}
	constructor( context ) {
		super( context )
		this.interaction = context.interaction
	}

	async displayCreateOutput( { interaction , result , board } ) {
		const embed = {
			title: 'Табло создано' ,
			description: `**Результат:** ${
				result instanceof Error ? 'исключение' : 'успех'
			}.\n${ escapeMarkdown( String( result ).slice( 0 , 1_000 ) ) }` ,
			components: [
				{
					type: ComponentType.Button ,
					customId: 'open-list' ,
					label: 'Показать список счётчиков сервера' ,
					style: ButtonStyle.Secondary ,
				} ,
				{
					type: ComponentType.Button ,
					customId: 'delete-board' ,
					label: 'Удалить этот счётчик' ,
					style: ButtonStyle.Secondary ,
				} ,
			] ,
		}
		const message = await interaction.message.msg( embed )

		const filter = ( { user } ) => interaction.user === user
		const collector = message.createMessageComponentCollector( {
			max: 1 ,
			filter ,
			time: 2 * MINUTE ,
		} )

		const boardsCommand = await CommandsManager.commandInstance( 'boards' )
		collector.on( 'collect' , async ( interaction ) => {
			const { customId } = interaction
			customId === 'delete-board' && CountersManager.delete( board )
			customId === 'open-list'
			&& boardsCommand.onChatInput( interaction.message , interaction )
		} )
		collector.on( 'end' , () => message.msg( { edit: true , components: [] } ) )
	}

	async onProcess() {
		const { context , _interface } = this
		const { interaction } = context
		const { channel , user } = interaction

		_interface.setChannel( interaction )

		const boardBases = [ ... render_strategies.values() ]

		_interface.setDefaultMessageState( {
			fetchReply: true ,
			title: '🪄 Выберите стратегию отображения' ,
			description: `Табло работает с каналами и сообщениями.\nВыберите основу для дальнельшей настройки.\n\n${ boardBases
				.map(
					( { label , description , emoji } ) =>
						`> ❯ ${ emoji } ${ capitalize( label ) }\n> ${ NULL_WIDTH_SPACE }\n> ${ description }.\n> ${ NULL_WIDTH_SPACE }` ,
				)
				.join( '\n\n' ) }` ,
		} )
		_interface.setReactions( boardBases.map( ( { emoji } ) => emoji ) )
		await _interface.updateMessage()
		const boardBase = await ( async () => {
			const { promise , resolve , reject } = Promise.withResolvers()
			const dispose = disposableListen(
				_interface.emitter ,
				MessageInterface.Events.allowed_collect ,
				async ( { interaction } ) => {
					dispose()
					resolve(
						boardBases.find(
							( { emoji } ) => emoji === codeOfEmoji( interaction.emoji ) ,
						) ,
					)
				} ,
			)
			setTimeout( () => {
				reject( new Error( 'Timeout' ) )
				dispose()
			} , MINUTE * 3 )
			return promise
		} )()

		context.boardBase = boardBase
		context.board = BoardFactory.init( context )

		const board = await boardBase.setup( context )
		if ( !board ) {
			return
		}
		await boardBase.render( board )
	}

	process_counters_limit() {
		const { interaction } = this.context
		if (
			board_singleton.loop.items.filter(
				board => board.gid === interaction.guild.id ,
			).length >= 15
		) {
			interaction.channel.msg( {
				title: 'Максимум пятнадцать счётчиков' ,
				color: '#ff0000' ,
				delete: 12 * SECOND ,
			} )
		}
	}
}

class CommandDefaultBehavior extends BaseFlagSubcommand {
	onProcess() {
		const { channel } = this.context

		channel.msg( {
			description: 'Добро пожаловать!' ,
			components: justButtonComponents(
				{
					label: 'Создать табло' ,
					style: ButtonStyle.Primary ,
					customId: '@command/board/create' ,
				} ,
				{ label: 'Список' } ,
				{ label: 'Отредактировать' } ,
				{ label: 'Удалить' } ,
			) ,
		} )
	}
}

class Command extends BaseCommand {
	componentsCallbacks = {
		create: ( context ) => {
			new Create_FlagSubcommand( context ).onProcess()
		} ,
	}

	options = {
		name: 'board' ,
		id: 42 ,
		media: {
			description:
				'Отличный способ отображать статистику — с помощью шаблонов создайте динамический текст, который будет меняться каждые пятнадцать минут. Счётчики могут менять как имя любого канала, так и содержание сообщения.' ,
			example: `!board #без аргументов` ,
		} ,
		accessibility: {
			publicized_on_level: 15 ,
		} ,
		alias:
			'табло счётчик счетчик board count counter рахівник счётчики счетчики рахівники counters' ,
		allowDM: false ,
		type: 'guild' ,
		userPermissions: PermissionsBits.ManageChannels ,
	}

	async onChatInput( msg , interaction ) {
		const context = await CommandRunContext.new( interaction , this )
		context.setWhenRunExecuted( this.run( context ) )
		return context
	}

	async run( context ) {
		new CommandDefaultBehavior( context ).onProcess()
	}
}

export default Command
