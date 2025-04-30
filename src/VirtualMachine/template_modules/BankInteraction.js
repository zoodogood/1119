import { SECOND } from '#constants/time.js'
import { guildDataOf , userDataOf } from '#src/data/singleton.js'
import { addResource } from '#src/user/resources/addResource.js'
import { assert } from '#src/assert/export.js'
import { PropertiesEnum } from '#src/data/Properties.js'
import { question } from '#src/discord/utils.js'
import { Emoji } from '#src/emojis/emojis.js'
import { percent_string } from '#src/formatters/formatters.js'
import { ending } from '@zoodogood/utils/primitives'

export class BankInteraction {
	#channel
	#context
	#executor
	#guild
	#source
	constructor( context , source ) {
		this.#context = context
		this.#source = source
		this.#guild = context.guild
		this.#executor = context.executor
		this.#channel = context.channel
	}

	bankCoins() {
		return guildDataOf( this.#guild ).coins
	}

	requestGetFromBank( value , message ) {
		if ( this.bankCoins() < value ) {
			throw new Error( 'Not enough coins' )
		}
		const executor = this.#executor
		const guild = this.#guild
		const context = this.#context
		assert( executor )

		guildDataOf( guild ).coins -= value
		context.channel.msg( {
			author: {
				key: executor.username ,
				iconURL: executor.avatarURL() ,
			} ,
			description: `Вам начислено ${ value } ${ Emoji.coins }! ${ message }` ,
		} )

		addResource( {
			resource: PropertiesEnum.coins ,
			user: this.#executor ,
			value ,
			executor ,
			context ,
			source: 'BankInteraction.requestGetFromBank' ,
		} )
		return true
	}

	async requestPayToBank( value , prompt ) {
		const executor = this.#executor
		const guild = this.#guild
		const context = this.#context
		const channel = this.#channel
		const source = this.#source
		const { emoji } = await question( {
			channel ,
			user: executor ,
			message: {
				author: {
					key: executor.username ,
					iconURL: executor.avatarURL() ,
				} ,
				description: `Сделка: ${ prompt }. Основана пользователем ${ source.empowered }.\n\nВнести в казну ${ ending( value , 'коин' , 'ов' , '' , 'а' ) } ${ Emoji.coins } ?` ,
				footer: {
					text: `У вас ${ ending( userDataOf( executor ).coins , 'коин' , 'ов' , '' , 'а' ) }${ userDataOf( executor ).coins < value ? ` (${ percent_string( userDataOf( executor ).coins / value ) } от требуемого)` : '' }` ,
				} ,
			} ,
			messageOptions: {
				disable: true ,
			} ,
			reactions: [ userDataOf( executor ).coins > value && '✅' , '❌' ] ,
		} )
		if ( emoji === '❌' ) {
			context.channel.msg( { title: 'Отклонено' , delete: SECOND * 8 } )
			return null
		}
		if ( emoji !== '✅' ) {
			return null
		}
		guildDataOf( guild ).coins += value
		addResource( {
			resource: PropertiesEnum.coins ,
			user: executor ,
			value: -value ,
			executor ,
			context ,
			source: 'BankInteraction.requestPayToBank' ,
		} )
		return true
	}
}
