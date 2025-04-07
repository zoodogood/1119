import { Collection } from '@discordjs/collection'

export function transformToCollectionUsingKey( array ) {
	const entries = array.map( object => [ object.key , object ] )
	return new Collection( entries )
}
