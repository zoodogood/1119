import { relativeSiteRoot } from '#lib/safe-utils.js';
import { Collection } from "@discordjs/collection";
import Path from 'path';

class PagesRouter {

	static PAGES_FOLDER_PATH = "./src/site/src/pages";
	static collection = new Collection();
	static #pagesMap = new Map();

	static resolvePages(PagesURLs){
		for (const path of PagesURLs){
			const page = this.resolvePage(path);
			this.addPage(page);
		}
	}

	static #svelteApp;
	static setSvelteApp(svelteApp){
		this.#svelteApp = svelteApp;
	}

	static resolvePage(path){
		const key = this.resolvePageName(path);

		const relativeToPages = (() => {
			const isFolderIndex = (arr) => arr.at(-1).toLowerCase() === "index";
			const arr = key.split("/");
			
			isFolderIndex(arr) && arr.splice(-1, 1);
			return arr.join("/");
		})();
		
		return {source: path, key, relativeToPages};
	}

	static resolvePageName(path){
		const directory = this.PAGES_FOLDER_PATH;
	
	
		const name = Path
			.relative(directory, path)
			.replaceAll("\/", "/")
			.replaceAll("+", "")
			.replaceAll(/\..+$/g, "")
			.toLowerCase()
			.trim();

		return name;
	}

	
	
	static addPage(page){
		const pagesMap = this.#pagesMap;
		pagesMap.set(page.key , page);
		pagesMap.set(page.relativeToPages , page);
		pagesMap.set(page.source , page);

		this.collection.set(page.key, page);
	}

	static getPageBy(any){
		return this.#pagesMap.get(any);
	}

	static get pages(){
		return Object.fromEntries(
			[...this.collection.entries()]
				.map(([any, {key}]) => [any, key])
		);
	}

	static relativeToPage(key){
		const svelteApp = this.#svelteApp;
		const url = relativeSiteRoot(svelteApp, key);
		const simplifyURL = (url) => {
			return url.endsWith("index") ? url.split("/").slice(0, -1).join("/") : url;
		}
		return simplifyURL(url);
	}

	static redirect(path){
		this.#svelteApp.document.location.href
			= this.relativeToPage(path);
	}
}



export default PagesRouter;
export { PagesRouter };