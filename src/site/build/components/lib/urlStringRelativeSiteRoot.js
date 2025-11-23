import { keyValueFormat } from "#src/fp/record/formatters/keyValueFormat.js"

/**
 *
 * @param {import("#src/site/build/components/app_singleton.js").default} svelteApp
 * @param {*} path
 * @param {*} removeQueries
 * @returns
 */
function urlStringRelativeSiteRoot( svelteApp , path = '' , {queries} = {} ) {
	const { origin } = document.location

	return `${ origin }/${ svelteApp.url.base }/${ path }${ queries ? `?${ keyValueFormat(queries, (k, v) => `${k}=${v}`) }` : '' }`
}

export { urlStringRelativeSiteRoot }
