import { Collection } from '@discordjs/collection'

/**
 * @template K, T
 * @param {(T & {key: K})[]} array
 * @returns {Collection<K, T>} Collection<K, T>
 */
export function transformToCollectionUsingKey( array ) {
	/**
	 * @type {[K, T][]}
	 */
	const entries = array.map( object => [ object.key , object ] )
	return new Collection( entries )
}
