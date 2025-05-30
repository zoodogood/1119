/**
 *
 * @param {import("#src/site/build/components/app_singleton.js")} svelteApp
 * @param {*} path
 * @param {*} removeQueries
 * @returns
 */
function relativeSiteRoot( svelteApp , path = '' , removeQueries = true ) {
	const { origin , search } = document.location

	return `${ origin }/${ svelteApp.url.base }/${ path }${ removeQueries ? '' : `${ search }` }`
}

export { relativeSiteRoot }
