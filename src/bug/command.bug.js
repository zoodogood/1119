import config from '#config'
import { SECOND } from '#constants/time.js'
import { mol_tree2_string_from_json } from '#src/$mol.js'
import { assert } from '#src/assert/export.js'
import client from '#src/bot/client/singleton.js'
import {
	BaseCommand ,
	BaseFlagSubcommand ,
} from '#src/commands/BaseCommand/BaseCommand.js'
import {
	cli_parser_parse_flags ,
	process_flags ,
} from '#src/commands/BaseCommand/parse_flags.js'
import { BaseCommandRunContext } from '#src/commands/CommandRunContext.js'
import { userDataOf, singletonBotData } from '#src/data/singleton.js'
import dayjs from '#src/dayjs.js'
import { MessageInterface } from '#src/discord/MessageInterface.js'
import { Pager } from '#src/discord/Pager.js'
import {
	justModalQuestion ,
	parse_embedInstance ,
	question ,
} from '#src/discord/utils.js'
import ErrorsHandler from '#src/ErrorsHandler/ErrorsHandler.js'
import { crop_string } from '#src/formatters/formatters.js'
import { resolveGithubPath } from '#src/github/resolveGithubPath.js'
import { createCollectionWithKey } from '#src/nodejs/Collection/create.js'

import { process_startedAt } from '#src/nodejs/process_startedAt.js'
import { maybe_multiline , uid , weekHour } from '#src/safe-utils.js'
import { path } from '#src/url/export.js'
import { justButtonComponents } from '@zoodogood/utils/discordjs'
import { ending } from '@zoodogood/utils/primitives'
import { ComponentType , escapeCodeBlock , escapeMarkdown } from 'discord.js'

function insertBugInfo( {
	reportId ,
	importanceStatusIndex ,
	error_message ,
	reportText ,
	reporterId ,
	session ,
	informMessageId ,
} ) {
	return ( ( new BugsField ).field[ reportId ] = {
		importanceStatusIndex ,
		error_message ,
		reportText ,
		reportId ,
		reporterId ,
		session ,
		informMessageId ,
	} )
}
function informBugToBugChannel( {
	importanceStatus ,
	error_message ,
	reportText ,
	reportId ,
} ) {
	const target = client.channels.cache.get( config.guild.bugsChannelId )
	return target.msg( {
		title: 'Отчёт о неисправности' ,
		description: maybe_multiline( [
			'Статус важности ошибки:\n' ,
			importanceStatus?.label || 'Не указан' ,
			'\n' ,
			'Текст отчёта:\n' ,
			reportText ,
			'\n\n' ,
			'Идентификатор ошибки:\n' ,
			error_message ,
		] ) ,
		footer: { text: reportId } ,
		components: justButtonComponents(
			{
				customId: `@command/bug/update_error_message_status:unique:${ reportId }` ,
				label: '— Уникален' ,
			} ,
			{
				customId: `@command/bug/update_error_message_status:not_a_bug:${ reportId }` ,
				label: '— Опровергнут' ,
			} ,
			{
				customId: `@command/bug/update_error_message_status:related:${ reportId }` ,
				label: 'Связать с предшествующим' ,
			} ,
		) ,
	} )
}

function update_error_message_status( context ) {
	const { interaction , user } = context
	if ( !config.developers.includes( user.id ) ) {
		interaction.msg( {
			ephemeral: true ,
			content: `Данное взаимодействие доступно только <@${ config.developers[ 0 ] }>` ,
		} )
		return
	}
	const [ command , reportId ] = context.params
	const bug = ( new BugsField ).field[ reportId ]

	assert( bug )
	switch ( command ) {
	case 'unique':
		return ( () => {
			const informMessage = interaction.message

			informMessage.msg( {
				components: justButtonComponents( {
					label: 'Объявить исправленым' ,
					customId: `@command/bug/update_error_message_status:fixed:${ reportId }` ,
				} ) ,
				... parse_embedInstance( informMessage.embed ) ,
				footer: { text: 'Принят как уникальная ошибка' } ,
				edit: true ,
			} )

			const user = client.users.cache.get( bug.reporterId )
			user.msg( {
				content: maybe_multiline( [
					'Отчёт о неисправности принят со статусом уникальной ошибки\n' ,
					'Пожалуйста, примите вознаграждение в размере 2 000 коинов' ,
				] ) ,
			} )
			userDataOf( user ).coins += 2_000
			interaction.msg( {
				content: `${ interaction.customId } — успех` ,
				ephemeral: true ,
			} )
		} )()

	case 'not_a_bug':
		return ( async () => {
			const informMessage = interaction.message
			informMessage.msg( {
				components: [] ,
				... informMessage.embed ,
				footer: { text: 'Помечено как то что не является багом' } ,
				edit: true ,
			} )
			interaction.msg( {
				content: `${ interaction.customId } — успех` ,
				ephemeral: true ,
			} )
			const user = client.users.cache.get( bug.reporterId )
			user.msg( {
				content: 'Отправленный отчёт об ошибке: не являлось багом' ,
			} )
		} )()

	case 'related':
		return ( async () => {
			const informMessage = interaction.message

			const target_message = await ( async () => {
				const { value } = await question( {
					channel: interaction ,
					user: interaction.user ,
					message: {
						content: 'Ответьте на сообщение, чтобы прикрепить' ,
						ephemeral: true ,
						fetchReply: true ,
					} ,
				} )
				const target_message_id = value.reference.messageId

				return await client.channels.cache
					.get( config.guild.bugsChannelId )
					.messages
					.fetch( target_message_id )
			} )()

			const thread
					= target_message.thread
						|| ( await target_message.startThread( {
							name: 'Больше' ,
						} ) )

			const message = await thread.msg( {
				... parse_embedInstance( informMessage.embed ) ,
			} )
			assert( message.id )
			informMessage.delete()

			const user = client.users.cache.get( bug.reporterId )
			user.msg( {
				content:
						'Отправленный отчёт о неиспправности: связан с предшествующим отчётом об этой же ошибке' ,
			} )
		} )()

	case 'fixed':
		return ( async () => {
			const informMessage = interaction.message
			bug.isFixed = true
			informMessage.msg( {
				components: justButtonComponents( {
					label: 'Исправлено!' ,
					disabled: true ,
				} ) ,
				... parse_embedInstance( informMessage.embed ) ,
				edit: true ,
			} )
			interaction.msg( {
				content: `${ interaction.customId } — успех` ,
				ephemeral: true ,
			} )
		} )()
	}
}

class BugsField {
	static KEY = 'bug'
	field
	constructor() {
		this.field = singletonBotData()[ BugsField.KEY ] ||= {}
	}
}

// MARK: Flags
class Help_FlagSubcommand extends BaseFlagSubcommand {
	static FLAG_DATA = {
		name: '--help' ,
		capture: [ '-h' , '--help' ] ,
		description: 'Получить обзор команды' ,
		finalize( context , { value } ) {
			new Help_FlagSubcommand( context , value ).onProcess()
			return true
		} ,
	}

	onProcess() {
		this.context.channel.msg( {
			title: 'Команда вызвана с параметром --help' ,
			description: maybe_multiline( [
				'Позволяет создавать отчёты о нарушениях работы программы.' ,
				' ' ,
				'А также видеть созданные отчёты' ,
			] ) ,
		} )
		return true
	}
}

const Importances = createCollectionWithKey( [
	{
		label: 'Опасно' ,
		key: 'Dangerous' ,
		value: '0' ,
		description: 'Имеет необратимые последствия' ,
	} ,
	{
		label: 'Необходимо' ,
		key: 'Needed' ,
		value: '1' ,
	} ,
	{
		label: 'Мешает' ,
		key: 'Disturbs' ,
		value: '2' ,
		description: 'Можно обойти или проблема незначительна' ,
	} ,
	{
		label: 'Cпокойно' ,
		key: 'Calmy' ,
		value: '3' ,
		description: 'Возможно, опечатка?' ,
	} ,
] )

class CommandDefaultBehaviour extends BaseFlagSubcommand {
	// file:@sendErrorInfo
	static ErrorMomentNamespace = class {
		onProcess() {}
		setContext( parent , context ) {
			this.parent = parent
			this.context = context
			return this
		}
	}

	_interface = ( new MessageInterface )

	error_moment = ( new CommandDefaultBehaviour.ErrorMomentNamespace )

	importanceStatus = null

	async askReportTextAndConfirm( interaction ) {
		const components = [
			{
				label: 'Вы открыли окно уведомления об ошибке' ,
				required: true ,
				maxLength: 1_000 ,
				value:
					this.context.cliParsed
						.at( 0 )
						.parser
						.captureResidue( { name: 'residue' } )
						.collect()
						.captures
						.get( 'residue' )
						?.toString() || undefined ,
				placeholder: 'Опишите причинно-следственную связь' ,
			} ,
		]

		const { response , fields } = await justModalQuestion( {
			interaction ,
			title: 'Отправить' ,
			components ,
		} )

		if ( !response ) {
			return
		}
		const { value: reportText } = [ ... fields.values() ].at( 0 )
		const bugInfo = {
			importanceStatus: this.importanceStatus ,
			importanceStatusIndex: Number.parseInt( this.importanceStatus?.value || '-1' ) ,
			importanceStatusLabel: this.importanceStatus?.label || 'Не указан' ,
			error_moment: this.error_moment ,
			error_message: this.error_moment.context?.error.message ,
			reportText ,
			reportId: uid() ,
			reporterId: interaction.user.id ,
			session: process_startedAt() ,
			informMessageId: null ,
		}
		const content = maybe_multiline( [
			'Спасибо за содействие в решении, вероятной, проблемы!\n' ,
			( () => {
				const { context: error_context } = this.error_moment
				if ( !error_context ) {
					return undefined
				}
				const { error , primary } = error_context
				const group = ErrorsHandler.getErrorsGroupBy( error.message )
				group.addReport( bugInfo.reportId )
				return maybe_multiline( [
					'\n' ,
					'Момент ошибки:\n' ,
					`Идентификатор ошибки:\n${ error.message }\n` ,
					primary
					&& maybe_multiline( [
						'\n' ,
						'Дополнильные данные:\n' ,
						'```tree\n' ,
						escapeCodeBlock( mol_tree2_string_from_json( primary ) ) ,
						'\n```\n' ,
					] ) ,
				] )
			} )() ,
			`Статус важности ошибки: ${ this.importanceStatus?.label || 'Не указан' }\n` ,
			`\nОтчёты публикуются на сервере бота: [ссылка-приглашение](${ config.guild.url })\n` ,
		] )
		response.msg( { content } )
		const inform = await informBugToBugChannel( bugInfo )
		bugInfo.informMessageId = inform.id
		insertBugInfo( bugInfo )
	}

	onProcess() {
		const { _interface , context } = this
		const { interaction } = context
		context.options.error_moment_context
		&& this.error_moment
			.setContext( this , context.options.error_moment_context )
			.onProcess()

		_interface.setChannel( interaction )
		_interface.setUser( interaction.user )
		_interface.setRender( () => {
			return {
				description: maybe_multiline( [
					'Для достижения ясности указывайте «Ожидаемое поведение и текущее поведение программы»' ,
				] ) ,
				fetchReply: true ,
				author: {
					iconURL: interaction.user.avatarURL() ,
					name: interaction.user.username ,
				} ,
			}
		} )
		_interface.setComponents( [
			[
				{
					type: ComponentType.StringSelect ,
					options: [ ... Importances.values() ] ,
					customId: 'setImportance' ,
					placeholder: 'Важность проблемы' ,
				} ,
			] ,
			justButtonComponents( {
				label: 'Открыть модальное окно отправки' ,
				customId: 'askReportTextAndConfirm' ,
			} ) ,
		] )
		_interface.updateMessage()
		_interface.emitter.on(
			MessageInterface.Events.allowed_collect ,
			( { interaction } ) => {
				switch ( interaction.customId ) {
				case 'askReportTextAndConfirm':
					return this.askReportTextAndConfirm( interaction )

				case 'setImportance':
					this.importanceStatus = Importances.at( +interaction.values[ 0 ] )
					interaction.msg( {
						content: 'Статус важности проблемы установлен' ,
						ephemeral: true ,
						fetchReply: true ,
						delete: 2 * SECOND ,
					} )
				}
			} ,
		)
	}
}

class Errors_FlagSubcommand extends BaseFlagSubcommand {
	static FLAG_DATA = {
		name: '--errors' ,
		capture: [ '-l' , '--list' , '--errors' , '--errors-list' ] ,
		description: 'Отобразить состояние ошибок этой и предыдущей сессий' ,
		finalize( context , { value } ) {
			new Errors_FlagSubcommand( context , value ).onProcess()
			return true
		} ,
	}

	pager = ( new Pager )

	/**
	 *
	 * @param {{groups: import("#src/ErrorsHandler/ErrorsHandler.js").Group[]}} param0
	 * @param {{ session_label: string, session_timestamp?: number }} param1
	 * @returns
	 */
	errors_session_to_pages_bulk(
		{ groups } ,
		{ session_label , session_timestamp } ,
	) {
		const bugsChannelGuildId
			= client.channels.cache.get( config.guild.bugsChannelId )?.guild.id || null

		return [
			maybe_multiline( [
				`Карта ошибок **${ session_label }** сессии` ,
				session_timestamp
				&& ` (${ dayjs( session_timestamp ).format( 'DD.MM HH:mm' ) })` ,
				': ' ,
				`${ ending(
					groups.length ,
					'' ,
					'следующие {} страниц' ,
					'следующая страница' ,
					'следующие {} страницы' ,
					{ unite: ( quantity , base ) => base.replace( '{}' , String( quantity ) ) } ,
				) } содержат по уникальной ошибке\n` ,
				'\n' ,
				... groups.map(
					( { key } ) =>
						`- **${ escapeMarkdown( crop_string( key.replaceAll( '\n' , ' ' ) , 100 ) ) }**\n` ,
				) ,
			] ).slice( 0 , 2000 ) ,
			... groups.map( ( { key , meta , errors } ) =>
				maybe_multiline( [
					`${ crop_string( key.replaceAll( '\n' , ' ' ) , 100 ) }\n` ,
					( meta.uniqueTags?.size || meta.uniqueTags?.length )
					&& `Ярлыки: ${ Array.from( meta.uniqueTags )
						.map( $ => `\`${ $ }\`` )
						.join( ', ' ) }\n` ,
					`Повторов: ${ meta.errorsCount }\n` ,
					meta.reports?.length
					&& `Отчёт: https://discord.com/channels/${ bugsChannelGuildId }/${ config.guild.bugsChannelId }/${ ( new BugsField ).field[ meta.reports[ 0 ] ].informMessageId } (id: ${ meta.reports[ 0 ] })\n` ,
					( () => {
						const errors_locations = new Set(
							errors.filter( ( { stackData } ) => stackData?.fileOfError ) ,
						)
						if ( !errors_locations.size ) {
							return null
						}
						const locations = [ ... errors_locations.values() ]
							.map( ( { stackData: { fileOfError , lineOfCode } } ) => {
								const relative = path.relative( process.cwd() , fileOfError )
								return maybe_multiline( [
									`- 📂 [${ path.relative( path.resolve( relative , '../..' ) , relative ) }]` ,
									`(${ resolveGithubPath( relative , lineOfCode ) })` ,
								] )
							} )
							.join( '\n' )
						return `${ ending( errors_locations.size , 'Локаци' , 'и' , 'я' , 'и' , { unite: ( _ , word ) => word } ) } происхождения:\n${ locations }`
					} )() ,
					'\n' ,
					'```\nㅤ```\n' ,
					crop_string(
						errors
							.map( ( { createdAt } ) => `**${ weekHour( createdAt ) }**` )
							.join( ', ' ) ,
						200 ,
					) ,
					'\n' ,
					errors[ 0 ]?.stackData && crop_string( errors[ 0 ].stackData.stack , 1000 ) ,
				] ) ,
			) ,
		].map( description => ( { description } ) )
	}

	async onProcess() {
		const { get_session , errors_handler_previous_session } = await import(
			'#src/ErrorsHandler/PreviousSessionInstance/singleton.js'
		)

		const previous_session = await get_session()
		ErrorsHandler.Core.updateSessionMetadata()
		const current_session = ErrorsHandler.Core.toJSON()

		this.pager.setChannel( this.context.channel )
		current_session?.meta.errorsCount
		&& this.pager.addPages(
			... this.errors_session_to_pages_bulk( current_session , {
				session_label: 'текущей' ,
			} ) ,
		)
		previous_session?.meta.errorsCount
		&& this.pager.addPages(
			... this.errors_session_to_pages_bulk( previous_session , {
				session_label: 'предыдущей' ,
				session_timestamp:
						+( await errors_handler_previous_session.fileId() ) * SECOND ,
			} ) ,
		)

		this.pager.pages.length === 0
		&& this.pager.addPages( {
			description: 'Нет ошибок за текущую и предыдущую сессии' ,
		} )

		this.pager.updateMessage()
	}
}

// MARK: RunContext
class CommandRunContext extends BaseCommandRunContext {
	static async new( ... params ) {
		const context = new this( ... params )
		return context
	}
}

class Command extends BaseCommand {
	componentsCallbacks = {
		update_error_message_status ,
	}

	options = {
		name: 'bug' ,
		id: 2 ,
		media: {
			description: 'Структурируйте информацию об ошибках, отправляйте запросы' ,
			example: `!bug например, команда эмбеды при использовании сразу говорит, что они не найдены, хотя в канале есть` ,
		} ,
		alias: 'баг bugs error errors ошибка ошибки' ,
		allowDM: true ,
		cooldown: 10 * SECOND ,
		cooldownTry: 3 ,
		type: 'dev' ,
		cliParser: {
			flags: [ Help_FlagSubcommand.FLAG_DATA , Errors_FlagSubcommand.FLAG_DATA ] ,
		} ,
		accessibility: {
			publicized_on_level: 2 ,
		} ,
		hidden: true ,
	}

	async onChatInput( message , interaction ) {
		const context = await CommandRunContext.new( interaction , this )
		context.setWhenRunExecuted( this.run( context ) )
		return context
	}

	/**
	 *
	 * @param {CommandRunContext} context
	 * @returns {CommandRunContext}
	 */
	async run( context ) {
		cli_parser_parse_flags( this , context )
		if ( await process_flags( context ) ) {
			return
		}

		await new CommandDefaultBehaviour( context ).onProcess()
	}
}

export default Command
