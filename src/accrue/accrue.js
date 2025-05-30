export function accrue( value , ... chain ) {
	for ( const callback of chain ) {
		value = callback( value )
	}
	return value
}

export async function accrueAsync( value , ... chain ) {
	value = await value
	for ( const callback of chain ) {
		value = await callback( value )
	}
	return value
}

export function arrayMapFactory( callback ) {
	return array => array.map( callback )
}

export function arrayFlatFactory() {
	return array => array.flat()
}

export function promiseAll( x ) {
	return Promise.all( x )
}

export function arrayMapProperty( property , mapFn ) {
	return ( array ) => {
		array.forEach( ( x , i ) => x[ property ] = mapFn( x[ property ] , i ) )
		return array
	}
}

export function arrayParallerTaskFactory( taskFn ) {
	return array => Promise.all( array.map( taskFn ) )
}

