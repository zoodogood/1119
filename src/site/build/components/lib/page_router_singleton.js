import PagesKeyEnum from '#src/site/build/_public_out/enum[builded].mjs'
import * as Pages from '#src/site/build/_public_out/exports[builded].mjs'
import svelteApp from '#src/site/build/components/app_singleton.js'
import { urlStringRelativeSiteRoot } from '#src/site/build/components/lib/urlStringRelativeSiteRoot.js'

export function current_page_by_route() {
	return (
		Pages[
			svelteApp.url.subpath
				.filter( subpath => !subpath.startsWith( ':' ) )
				.join( '_' )
				.toLowerCase()
		] ?? Pages.pages
	)
}

/**
 *
 * @param {keyof typeof Pages} page_key
 */
export function page_location( page_key , options = {} ) {
	return urlStringRelativeSiteRoot( svelteApp , page_key , options )
}

export { Pages , PagesKeyEnum }
