import writeError from '#src/site/_build/components/lib/writeErrorToServer.js'

export async function interactWithButton( source , clickEvent , callback ) {
	const { target } = clickEvent
	const LOADING_STATE = 'Брмм'
	try {
		target.append( LOADING_STATE )
		await callback( clickEvent )
	} catch ( cause ) {
		target.append( `Err: ${ cause.message }` )
		const error = new Error( `interactWithButton with ${ source }` , { cause } )
		writeError( error )
		console.error( error )
		return
	} finally {
		[ ... target.childNodes ]
			.find( text => text.data === LOADING_STATE )
			?.remove()
	}
}
