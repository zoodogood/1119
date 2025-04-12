import { client } from '#src/bot/client/singleton.js'
import { BaseCommand } from '#src/commands/BaseCommand/BaseCommand.js'
import { randomWith } from '#src/safe-utils.js'
import { userDataOf } from '../data/singleton.js'

class Command extends BaseCommand {
	options = {
		name: 'iq' ,
		id: 31 ,
		media: {
			description:
				'Хотя мы не знаем ваш настоящий IQ, можем предложить наш собственный..\nВозможно, когда-то у нас появится тест на ICQ' ,
			example: `!iq <memb>` ,
		} ,
		accessibility: {
			publicized_on_level: 2 ,
		} ,
		alias: 'iqmeme icq айкю айкью iqbanana iqmonkey' ,
		allowDM: true ,
		cooldown: 15_000 ,
		type: 'user' ,
	}

	async onChatInput( msg , interaction ) {
		const memb
			= interaction.mention
				|| client.users.cache.get( interaction.params )
				|| msg.author

		const membData = userDataOf( memb )

		const { content } = interaction.message
		const commandName = content.match( /[a-zа-яїё]+/i )?.[ 0 ] ?? 'IQ'

		let first = true
		if ( 'iq' in membData ) {
			first = false
		}

		let iq = ( membData.iq = first
			? randomWith( 30 , 140 )
			: Math.max( membData.iq , 0 ) )
		const name = memb === msg.author ? 'вас' : 'него'

		let description
		if ( randomWith( 18 ) ) {
			description = `У ${ name }${
				!first ? ' всё так же' : ''
			} ${ iq } ${ commandName.toUpperCase() }`
		} else {
			iq = ++membData.iq
			description = `Удивительно, у ${ name } айкью вырос на одну единицу! Сейчас ${ commandName.toUpperCase() } === ${ iq }`
		}
		msg.msg( {
			title: '<a:iq:768047041053196319> + <a:iq:768047041053196319> = ICQ²' ,
			description ,
			author: { iconURL: memb.avatarURL() , name: memb.username } ,
		} )
	}
}

export default Command
