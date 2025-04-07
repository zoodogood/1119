import { transformToCollectionUsingKey } from '#src/nodejs/Collection/transformToCollectionUsingKey.js'

export const SpecialChannel = transformToCollectionUsingKey( [
	{
		key: 'chatChannel' ,
		label: 'Чат' ,
		description: 'Для сообщений о событиях' ,
		emoji: '🔥' ,
	} ,
	{
		key: 'logChannel' ,
		label: 'Для логов' ,
		description: 'Как журнал о взаимодействиях с ботом' ,
		emoji: '📒' ,
	} ,
	{
		key: 'hi.channel' ,
		label: 'Для приветствий' ,
		description: 'Для приветствий' ,
		emoji: '👌' ,
	} ,
] )

export function getSpecialChannel( guild , key ) {
	const id = guild.data[ key ]
	return guild.channels.cache.get( id )
}
export function sendToLogsChannel( guild , message ) {
	return getSpecialChannel( guild , 'logChannel' )?.msg( message )
}

export function sendToChatChannel( guild , message ) {
	return getSpecialChannel( guild , 'chatChannel' )?.msg( message )
}

export function isChatChannelExists( guild ) {
	return !!guild.data.chatChannel
}
