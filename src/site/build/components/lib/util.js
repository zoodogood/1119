/**
 * 
 * @param {import("#src/site/build/components/app_singleton.js")} svelteApp 
 * @param {*} path 
 * @param {*} removeQueries 
 * @returns 
 */
function relativeSiteRoot( svelteApp , path = '' , removeQueries = true ) {
	const { origin , search } = document.location
	const pathname = Object.values( svelteApp.url.base ).filter( Boolean ).join( '/' )

	return `${ origin }/${ pathname }/${ path }${ removeQueries ? '' : `${ search }` }`
}



export { relativeSiteRoot }
