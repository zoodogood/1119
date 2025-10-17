import client from '#src/bot/client/singleton.js'
import StorageManager from '#src/data/StorageManager/singleton/index.js'

export class ReactionsManager {
	static reactData = []

	constructor( id , channel , guild , type , reactions ) {
		const reactionObject = { id , channel , guild , type , reactions }
		const isExists = ReactionsManager.reactData.find(
			target => target.id === id ,
		)
		if ( isExists ) {
			Object.assign( isExists , reactionObject )
		} else {
			ReactionsManager.reactData.push( reactionObject )
		}
		StorageManager.write(
			this.constructor.path ,
			JSON.stringify( ReactionsManager.reactData ) ,
		)
		ReactionsManager.reactData = ReactionsManager.getMain()
	}

	static async getMain() {
		const data = await ReactionsManager.readFile()
		return data.map( react =>
			( ( { id , type , reactions } ) => ( { id , type , reactions } ) )( react ) ,
		)
	}

	static async handle() {
		const reactions = []
		const reactionsData = await ReactionsManager.readFile()
		for ( const data of reactionsData ) {
			const { guild: guildId , channel: channelId , id: messageId } = data

			const guild = client.guilds.cache.get( guildId )
			const channel = guild.channels.cache.get( channelId )
			const message = await channel.messages.fetch( messageId )
			if ( !message ) {
				continue
			}
			return reactions.push( data )
		}

		StorageManager.write( this.path , JSON.stringify( reactions ) )
		ReactionsManager.reactData = ReactionsManager.getMain()
	}

	static async loadReactionsFromFile() {
		ReactionsManager.reactData = await ReactionsManager.getMain()
	}

	static async readFile() {
		// const { default: data } = await import(this.path, {assert: {type: "json"}});
		// return data;
	}
}
