import { BaseCommand } from '#src/commands/BaseCommand/BaseCommand.js'
import { sleep } from '#src/safe-utils.js'
import { randomElementFromArray } from '@zoodogood/utils/objectives'
import { SECOND } from '../constants/time.js'

class Command extends BaseCommand {
	options = {
		name: 'ball' ,
		id: 40 ,
		media: {
			description:
				'Всегда отвечающий "нет" Шар, почему все думают, что он всевидящий?' ,
			example: '!ball {question?} # Не спрашивайте у него как его дела' ,
			poster:
				'https://media.discordapp.net/attachments/769566192846635010/872442452152307762/ball.gif' ,
		} ,
		alias: '8ball шар куля' ,
		allowDM: true ,
		expectParams: true ,
		cooldown: 3_000 ,
		type: 'other' ,
	}

	async onChatInput( msg , interaction ) {
		if ( !interaction.params.includes( ' ' ) ) {
			return msg.msg( {
				title: 'Это не вопрос' ,
				delete: 4 * SECOND ,
				color: '#ff0000' ,
			} )
		}

		msg.channel.sendTyping()
		await sleep( 700 )
		const _items = [
			{ _weight: 1 , answer: '*Что-то на призрачном*' } ,
			{ _weight: 1 , answer: 'Ты скучный, я спать' } ,
			{ _weight: 2 , answer: '\\*Звуки свёрчков\\*' } ,
			{ _weight: 3 , answer: 'нет-нет-нет.' } ,
			{ _weight: 3 , answer: 'Я проверил — нет' } ,
			{ _weight: 3 , answer: 'Может быть в другой вселенной' } ,
			{ _weight: 4 , answer: 'Абсолютно и беспрекословно, мой ответ — нет.' } ,
			{ _weight: 5 , answer: 'Меч лжи говорит, что да' } ,
			{ _weight: 6 , answer: 'Точно нет' } ,
			{ _weight: 7 , answer: 'неа' } ,
			{ _weight: 8 , answer: 'нет' } ,
		]
		const { answer } = randomElementFromArray(
			_items ,
			{ associatedWeights: _items.map( $ => $._weight ) } ,
		)
		msg.msg( { content: answer , reference: msg.id } )
	}
}

export default Command
