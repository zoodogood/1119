import { Collection } from '@discordjs/collection'

export function transformToCollectionUsingKey<T, K = string>( array : ( T & { key: string } )[] ) {
	const entries = array.map( object => [ object.key , object ] ) as [K , T][]
	return new Collection<K , T>( entries )
}

class CollectionWithAliases<V> extends Collection<string , V> {
	_aliasesHash: { [key : string]: V } = {}
	constructor( iterable : Iterable<readonly [string , V]> ) {
		super( iterable )
		for ( const [ _ , item ] of iterable ) {
			this._aliasHashAddItem( item )
		}
	}

	_aliasHashAddItem( item : V ) {
		const { key , aliases } = item as V & { key: string , aliases: string[] }
		this._aliasesHash[ key ] = item
		for ( const alias of aliases ) {
			this._aliasesHash[ alias ] = item
		}
	}

	get( key : string ) : V | undefined {
		return this.get( key ) || this._aliasesHash[ key ]
	}

	set( key : string , value : V ) {
		this._aliasHashAddItem( value )
		super.set( key , value )
		return this
	}
}

export function createCollectionWithAliases<T>( array : ( T & { key: string , aliases: string[] } )[] ) : CollectionWithAliases<T> {
	return new CollectionWithAliases( array.map( object => [ object.key , object ] ) )
}
