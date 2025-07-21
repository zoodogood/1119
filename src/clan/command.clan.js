import { BaseCommand } from '#src/commands/BaseCommand/BaseCommand.js'

class Command extends BaseCommand {
	options = {
		name: 'clan' ,
		id: 62 ,
		media: {
			description: 'пока тут пусто' ,
		} ,
		accessibility: {
			publicized_on_level: 9 ,
		} ,
		alias: 'клан' ,
		hidden: true ,
		type: 'other' ,
	}

	async onChatInput( msg , interaction ) {
		const member = interaction.mentionedOrAuthor

		msg.msg( { description: 'создайте его, в своём воображении' } )

		const description = 'тут пока что пусто'
		const fields = [ {} , {} ]

		const embed = {
			description ,
			fields ,
			footer: { text: member.tag , iconURL: member.avatarURL() } ,
		}

		return embed
	}
}

export default Command
