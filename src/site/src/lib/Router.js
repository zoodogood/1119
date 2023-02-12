import PagesEnum from "#static/build/svelte-pages/enum[builded].mjs";
import { relativeSiteRoot } from '#lib/util.js';

class Router {
	static #pagesEnum = PagesEnum;
	static #pathEnum = this.#resolvePathEnum(this.#pagesEnum);

	static #resolvePathEnum(pagesEnum){
		const pages = Object.keys(pagesEnum);
		const toPath = page => page.replaceAll("_", "/");
		const entries = pages.map((page) => [page, toPath(page)]);
		return Object.fromEntries(entries);
	}

	static get pages(){
		return this.#pathEnum;
	}

	static relativeToPage(path){

		relativeSiteRoot(location, path)
	}
}

export default Router;