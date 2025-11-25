export function keyValueFormat<T>(
	t : Record<string , T> ,
	format : ( k : string , v : T ) => string ,
) : string[] {
	return Object.entries( t ).map( ( [ k , v ] ) => format( k , v ) )
}
