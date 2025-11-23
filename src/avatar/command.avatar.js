import { BaseCommand } from '#src/commands/BaseCommand/BaseCommand.js'
import { SECOND } from '#src/constants/time.js'
import { responseWithAvatar } from './responseWithAvatar.js'

class Command extends BaseCommand {
	options = {
		name: 'avatar' ,
		id: 41 ,
		media: {
			description:
				'Отправляет картинку-аватар красивого пользователя <:panda:637290369964310530>\nЕсли вы хотите достичь более хорошего качества чем 128х128px, вам явно понадобится напрямую попросить человека поделится фоточками' ,
			example: `!avatar <memb>` ,
		} ,
		alias: 'аватар' ,
		allowDM: true ,
		cooldown: 12 * SECOND ,
		type: 'other' ,
	}

	async onChatInput( msg , interaction ) {
		return responseWithAvatar( interaction )
	}
}

export default Command
