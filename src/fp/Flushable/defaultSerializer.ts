export const defaultSerializer = {
	write: v => JSON.stringify( v ) ,
	read: ( v : string ) => JSON.parse( v ) ,
}
