import svelteApp from "#site/core/svelte-app_singleton.js";
import { relativeSiteRoot } from "#site/lib/util.js";
import PagesKeyEnum from "#src/public/build/svelte-pages/enum[builded].mjs";
import * as Pages from "#src/public/build/svelte-pages/exports[builded].mjs";

export function current_page_by_route() {
	return (
		Pages[
			svelteApp.url.subpath
				.filter((subpath) => !subpath.startsWith(":"))
				.join("_")
				.toLowerCase()
		] ?? Pages.pages
	);
}

export function page_location(page_key, options = {}) {
	if (!PagesKeyEnum.includes(page_key)) {
		throw new Error(`Invalid page key ${page_key}`);
	}

	return relativeSiteRoot(svelteApp, page_key, options.removeQueries);
}

export class PagesRouter {
	static getPageBy(alias) {
		return alias;
	}

	static relativeToPage(key) {
		return relativeSiteRoot(svelteApp, key);
	}
}

export { Pages, PagesKeyEnum };
export default PagesRouter;
