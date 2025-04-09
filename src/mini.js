export function factorySummarizeBy( property ) {
	return ( acc , current ) => acc + current[ property ]
}

export function factorySummarize() {
	return ( acc , current ) => acc + current
}

export function factoryGetPropertyValue( p ) {
	return x => x[ p ]
}

export function mapGetOrInsert( map , key , defaults ) {
	!map.has( key ) && map.set( key , defaults )
	return map.get( key )
}

export function capitalize( string ) {
	return string.slice( 0 , 1 ).toUpperCase() + string.slice( 1 )
}

export function sortByResolveMut( array , resolve , { reverse } = {} ) {
	return reverse
		? array.sort( ( a , b ) => resolve( a ) - resolve( b ) )
		: array.sort( ( a , b ) => resolve( b ) - resolve( a ) )
}

export function isObject( target ) {
	return target && typeof target === 'object'
}

export function average( sum , length ) {
	return Math.round( sum / length )
}

export function tap( fn ) {
	return ( ... args ) => {
		fn( ... args )
		return args[ 0 ]
	}
}

export function adjust( maybePrimitive , adjustFn , { defaultValue } = {} ) {
	return adjustFn( maybePrimitive ?? defaultValue )
}
