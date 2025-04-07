import { Client , GatewayIntentBits , Partials } from 'discord.js'

const client = new Client( {
	messageCacheMaxSize: 110 ,
	intents: Object.values( GatewayIntentBits ) ,
	partials: [ Partials.Message , Partials.Channel , Partials.Reaction ] ,
	allowedMentions: { repliedUser: true , parse: [ 'users' ] } ,
} )

export async function whenClientIsReady() {
	if ( client.readyAt ) {
		return true
	}

	return await new Promise( resolve => client.once( 'ready' , resolve ) )
}

export default client
export { client }
