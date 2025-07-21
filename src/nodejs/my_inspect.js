import client from '#src/bot/client/singleton.js'
import { inspect as _inspect } from 'node:util'

export async function inspect( value ) {
	const inspected = _inspect( value , {
		maxArrayLength: 10 ,
		maxStringLength: 50 ,
		numericSeparator: true ,
		getters: true ,
	} ).replace( client.token , '' )
	const proto = Object.getOwnPropertyNames( value )
		.filter( name => name !== 'constructor' )
		.map( name => `${ name }` )
		.join( '\n' )
	return `${ inspected }\n[ownPropertyNames ${ value.name }]\n${ proto }`
}
