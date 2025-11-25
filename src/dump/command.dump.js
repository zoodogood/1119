import { BaseCommand } from '#src/commands/BaseCommand/BaseCommand.js'
import { MINUTE , SECOND } from '#src/constants/time.js'
import { DataManager } from '#src/data/singleton.js'

class Command extends BaseCommand {
	options = {
		name: 'dump' ,
		id: 60 ,
		media: {
			description: '' ,
		} ,
		alias: 'дамп' ,
		allowDM: true ,
		cooldown: 100 * SECOND ,
		type: 'dev' ,
	}

	async onChatInput( msg , interaction ) {
		DataManager.file.write()
		const message = await msg.channel.send( {
			files: [
				{
					attachment: 'data/main.json' ,
					name: new Intl.DateTimeFormat( 'ru-ru' , {
						year: 'numeric' ,
						month: 'numeric' ,
						day: 'numeric' ,
						hour: 'numeric' ,
						minute: 'numeric' ,
					} ).format() ,
				} ,
			] ,
		} )

		setTimeout( () => message.delete() , 15 * MINUTE )
	}
}

export default Command
