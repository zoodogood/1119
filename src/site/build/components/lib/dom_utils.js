export function createElement( tag , attributes = {} , childs = [] ) {
	const element = document.createElement( tag )
	for ( const [ key , value ] of Object.entries( attributes ) ) {
		element.setAttribute( key , value )
	}
	childs.forEach( child => element.appendChild( child ) )
	return element
}

export async function whenDocumentReadyStateIsComplete( ) {
	return (
		document.readyState !== 'complete'
		&& ( await new Promise( resolve =>
			document.addEventListener( 'readystatechange' , resolve , { once: true } ) ,
		) )
	)
}
