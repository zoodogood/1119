export function factorySummarizeBy( property ) {
	return ( acc , current ) => acc + current[ property ]
}

export function factorySummarize() {
	return ( acc , current ) => acc + current
}

/**
 * @template T, C
 * @param {(x: T) => C} valueOf
 * @param {(a: C, b: C) => boolean} compareOperation
 * @returns {(a: T, b: T) => T} T
 */
export function factoryCompare( valueOf , compareOperation ) {
	return ( a , b ) => compareOperation( valueOf( a ) , valueOf( b ) ) ? a : b
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

export function _do( callback ) {
	return callback()
}

export function adjust( maybePrimitive , adjustFn , { defaultValue } = {} ) {
	return adjustFn( maybePrimitive ?? defaultValue )
}

/**
 * @template T
 * @param {T} x
 * @returns {() => T} () => T
 */
export function asGetterFn( x ) {
	return () => x
}

/**
 * @template T
 * @param {() => T} getter
 * @param {(value: T) => unknown} setter
 * @returns {(value?: T) => T}
 */
export function asAccessor( getter , setter ) {
	return new_value => new_value !== undefined ? ( setter( new_value ) , new_value ) : getter()
}

/**
 * @template T
 * @param {T} initializer
 * @param {(state: T) => T} getter
 * @param {(value: T) => T} setter
 * @returns {(value?: T) => T}
 */
export function accessorWithState( initializer , getter = v => v , setter = v => v ) {
	return new_value => new_value !== undefined ? ( initializer = setter( new_value ) , new_value ) : getter( initializer )
}

/**
 *
 * @param {(value?: number) => number} accessor
 * @param {number} value
 * @returns
 */
export function increment( accessor , value = 1 , orDefault = 0 ) {
	const previous = accessor() ?? orDefault
	return accessor( previous + value )
}

/**
 *
 * @param {(value?: number) => number} accessor
 * @param {number} value
 * @returns
 */
export function decrement( accessor , value = 1 , orDefault = 0 ) {
	const previous = accessor() ?? orDefault
	return accessor( previous + value )
}

/**
 *
 * @param {(value?: number) => number} accessor
 * @param {number} maximum
 */
export function modIncrement( accessor , maximum ) {
	const previous = accessor() || 0
	return accessor( previous % maximum )
}

export function checkFilterPropertyFactory( ... apply_parameters ) {
	return ( element , i ) => !element.filter || element.filter( ... apply_parameters , i )
}
