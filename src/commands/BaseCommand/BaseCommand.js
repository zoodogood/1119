import { BaseContext } from '#src/app/BaseContext/BaseContext.js'
import CooldownManager from '#src/CooldownManager.js'
import { singletonBotData } from '#src/data/singleton.js'
import { takeInteractionProperties } from '#src/discord/utils.js'
import { ErrorsHandler } from '#src/ErrorsHandler/ErrorsHandler.js'
import { sendErrorInfo } from '#src/ErrorsHandler/sendErrorInfo.js'

/** @import {BaseCommandRunContext} from '#src/commands/CommandRunContext.js' */
// @ts-check
/**
 * @typedef {import("@zoodogood/utils/CliParser").IFlagCapture & {
 *    description: string,
 *    effect: (context: BaseCommandRunContext, value: {flag: string, value: string, separator: string}, flag: BaseFlag) => boolean,
 *    finalize: (context: BaseCommandRunContext, value: {flag: string, value: string, separator: string}, flag: BaseFlag) => unknown
 * }} BaseFlag
 *
 * @typedef {{
 *    capture: import("@zoodogood/utils/CliParser").CapturedContentFlagMatchArray
 *    value: {flag: string, value: string, separator: string}
 *    description: string
 *    expectValue: boolean
 *    name: string
 *    effect: BaseFlag['effect']
 *    finalize: BaseFlag['finalize']
 * }} BaseFlagCapture
 */

const statistics_api = {
	increase: ( { interaction: { guild } , command } ) => {
		const commandOptions = command.options

		const botData = singletonBotData()
		const guildData = guild?.data

		if ( guildData ) {
			guildData.commandsUsed ||= {}
			guildData.commandsUsed[ commandOptions.id ] ||= 0
			guildData.commandsUsed[ commandOptions.id ]++
		}

		if ( botData ) {
			botData.commandsUsed[ commandOptions.id ] ||= 0
			botData.commandsUsed[ commandOptions.id ]++

			botData.commandsUsedToday ||= 0
			botData.commandsUsedToday++
		}
	} ,

	getUsesCount: ( id , guildData ) => {
		if ( guildData ) {
			guildData.commandsUsed ||= {}
			return guildData.commandsUsed[ id ] || 0
		}

		const botData = singletonBotData()
		return botData.commandsUsed[ id ] || 0
	} ,
}

class BaseCommand {
	componentsCallbacks = {}

	/**
	 *@type {{
	 *  name: string
	 *  media: {description: string, example?: string, poster?: string}
	 *  type: string
	 *  alias: string
	 *  allowDM?: boolean
	 *  expectMention?: boolean
	 *  expectParams?: boolean
	 *  cooldown?: number
	 *  cooldownTry?: number
	 *  myChannelPermissions?: bigint
	 *  myPermissions?: bigint
	 *  userChannelPermissions?: bigint
	 *  userPermissions?: bigint
	 *  cliParser?: {
	 *    flags: BaseFlag[]
	 *  }
	 *  accessibility?: {
	 *    publicized_on_level?: number
	 *  }
	 *  hidden?: boolean
	 *  removed?: boolean
	 *}}
	 */
	options = {}

	_cooldown_api( context ) {
		const { interaction } = context
		const { options } = this
		const { userData } = interaction
		return CooldownManager.api( userData , `CD_${ options.id }` , {
			heat: options.cooldownTry ?? 1 ,
			perCall: options.cooldown ,
		} )
	}

	async _error_strategy( error , context , execution_context ) {
		const execution_context_safe = execution_context?.toSafeValues() || null
		const { command , interaction , typeBase } = context
		ErrorsHandler.onErrorReceive( error , {
			userId: interaction.user.id ,
			type: typeBase.type ,
			command: command.options.name ,
			source: 'Command' ,
			... execution_context_safe ,
		} )
		sendErrorInfo( {
			channel: interaction.channel ,
			error ,
			interaction ,
			primary: execution_context_safe ,
		} )
	}

	_statistic_increase( context ) {
		statistics_api.increase( context )
	}

	/**
	 *
	 * @param {import("discord.js").Message} _message
	 * @param {ReturnType<import("#src/commands/CommandsManager/singleton.js").parseInputCommandFromMessage>} _interaction
	 * @abstract
	 */
	onChatInput( _message , _interaction ) {}

	onComponent( { params: rawParams , interaction } ) {
		const [ target , ... params ] = rawParams.split( ':' )
		const context = new BaseContext(
			`@oncomponent/${ this.options.name }/${ params }` ,
			{
				interaction ,
				primary: interaction ,
				... takeInteractionProperties( interaction ) ,
				params ,
			} ,
		)
		const callback = this.componentsCallbacks[ target ]
		if ( !callback ) {
			throw new Error( `Unknown component: ${ rawParams }` )
		}
		try {
			callback.call( this , context )
		} catch ( error ) {
			ErrorsHandler.onErrorReceive( error )
			sendErrorInfo( {
				error ,
				channel: interaction.channel ,
				interaction ,
				description: `${ target }/${ rawParams }` ,
			} )
		}
	}

	/**
	 * @abstract
	 */
	onSlash() {}
}

class BaseFlagSubcommand {
	/**
	 *
	 * @param {import("#src/commands/CommandRunContext").BaseCommandRunContext} context
	 * @param {import("@zoodogood/utils/CliParser").CapturedContent} [value]
	 */
	constructor( context , value ) {
		this.capture = value
		this.context = context
	}

	onProcess() {}
}

export { BaseCommand , BaseFlagSubcommand }
