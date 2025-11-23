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

export function page_location( page_key , options = {} ) {
	if ( !PagesKeyEnum.includes( page_key ) ) {
		throw new Error( `Invalid page key ${ page_key }` )
	}

	return urlStringRelativeSiteRoot( svelteApp , page_key , options )
}

export class PagesRouter {
	static getPageBy( alias ) {
		return alias
	}

	static relativeToPage( key ) {
		return relativeSiteRoot( svelteApp , key )
	}
}

export { Pages , PagesKeyEnum }
export default PagesRouter
