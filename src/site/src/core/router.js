import * as PagesExports from '#static/build/svelte-pages/exports[builded].mjs';
import Router from '#site/lib/Router.js';


function route(svelteApp){
	
	const subpath = svelteApp.url.subpath
		.filter(subpath => !subpath.startsWith(":"))
		.join("_");
	
	const key = Router.getPageBy( subpath.toLocaleLowerCase() )?.key;
	const _Page = PagesExports[key] ?? PagesExports.index;

	
	return _Page;
}

export { route };