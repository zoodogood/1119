import svelteApp from "#site/core/svelte-app_singleton.js";
import { relativeSiteRoot } from "#site/lib/util.js";
import PagesKeyEnum from "#src/public/build/svelte-pages/enum[builded].mjs";
import * as Pages from "#src/public/build/svelte-pages/exports[builded].mjs";


export function current_page_by_route() {
	return Pages[
			svelteApp.url.subpath
				.filter((subpath) => !subpath.startsWith(":"))
				.join("_")
				.toLowerCase()
		] ?? Pages.site_src_pages
}

export function page_location(page_key, options = {}) {
	PagesKeyEnum.includes(page_key);
}

class PagesRouter {

	static getPageBy(alias) {
		return alias
	}

	static relativeToPage(key) {
		const url = relativeSiteRoot(svelteApp, key);
		return url;
	}
}

export default PagesRouter;
export { PagesRouter };
