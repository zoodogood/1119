import { BaseCommand } from '#src/commands/BaseCommand/BaseCommand.js'
import { MINUTE , SECOND } from '#src/constants/time.js'
import CooldownManager from '#src/CooldownManager.js'
import { PropertiesEnum } from '#src/data/Properties.js'
import { userDataOf } from '#src/data/singleton.js'
import { randomWith } from '#src/safe-utils.js'
import { Actions } from '#src/user/actions/ActionManager.js'
import { addResource } from '#src/user/resources/addResource.js'
import { ending } from '@zoodogood/utils/primitives'

class Command extends BaseCommand {
	options = {
		name: 'casino' ,
		id: 57 ,
		media: {
			description:
				'Меня долго просили сделать Казино. И вот оно здесь!\nТакое же пустое как и ваши кошельки' ,
			example: `!casino {coinsBet | "+"}` ,
		} ,
		accessibility: {
			publicized_on_level: 9 ,
		} ,
		alias: 'казино bet ставка' ,
		expectParams: true ,
		allowDM: true ,
		cooldown: true ,
		type: 'other' ,
	}

	async onChatInput( msg , interaction ) {
		const { bet } = this.parseParams( interaction ) ?? {}
		if ( !bet ) {
			return
		}

		const { userData , user } = interaction
		if ( userData.coins < bet ) {
			msg.msg( { title: 'Недостаточно коинов' , color: '#ff0000' , delete: 3 * SECOND } )
			return
		}

		const diceRoll = randomWith( 8 )
		const embed = {
			title: 'Лесовитое казино' ,
			author: { name: msg.author.username , iconURL: msg.author.avatarURL() } ,
			delete: 20 * SECOND ,
			footer: { text: `Ставка: ${ bet }` } ,
		}
		const isWon = diceRoll % 2

		user.action( Actions.casinoSession , {
			isWon ,
			bet ,
		} )

		embed.description = `
**${ isWon ? 'Вы выиграли.' : 'Проиграли' }**
**Кидаем кубик.. выпадает:** \`${ diceRoll }\`; ${ isWon ? '🦝' : '❌' }

${
	isWon
		? `\\*Вам достается куш — ${ ending(
			bet * 2 ,
			'коин' ,
			'ов' ,
			'' ,
			'а' ,
		) } <:coin:637533074879414272>\\*`
		: 'Чтобы выиграть, должно выпасть число, которое не делится на 2'
}
`

		addResource( {
			user ,
			value: ( -1 ) ** +!isWon * bet ,
			executor: user ,
			source: 'command.casino' ,
			resource: PropertiesEnum.coins ,
			context: { interaction , isWon } ,
		} )
		this.setCooldown( user )
		msg.msg( embed )
	}

	parseParams( interaction ) {
		let bet = interaction.params.match( /\d+|\+/ )

		if ( bet === null ) {
			interaction.channel.msg( {
				title: 'Укажите Ставку в числовом виде!' ,
				color: '#ff0000' ,
				delete: 3 * SECOND ,
			} )
			return null
		}
		bet = bet[ 0 ]

		if ( bet === '+' ) {
			bet = interaction.userData.coins
		}

		bet = Math.max( 0 , Math.floor( bet ) )

		return { bet }
	}

	setCooldown( user ) {
		const COOLDOWN = 5 * MINUTE
		const { id } = this.options
		const key = `CD_${ id }`
		CooldownManager.api( userDataOf( user ) , key , { perCall: COOLDOWN } ).onCall()
	}
}

export default Command
