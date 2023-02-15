import { relativeSiteRoot } from '#lib/safe-utils.js';
import { Collection } from "@discordjs/collection";
import Path from 'path';
import app from '#app';

class PagesRouter {

	static PAGES_FOLDER_PATH = "./src/site/src/pages";
	static collection = new Collection();

	static resolvePages(PagesURLs){
		for (const path of PagesURLs){
			const page = this.resolvePage(path);
			this.addPage(page);
		}
	}

	static resolvePage(path){
		const key = this.resolvePageName(path);

		const relativeToPages = (() => {
			const isFolderIndex = (arr) => arr.at(-1).toLowerCase() === "index";
			const arr = key.split("_");
			
			isFolderIndex(arr) && arr.splice(-1, 1);
			return arr.join("/");
		})();
		
		return {source: path, key, relativeToPages};
	}

	static resolvePageName(path){
		const directory = this.PAGES_FOLDER_PATH;
	
	
		const name = Path
			.relative(directory, path)
			.replaceAll(/\\|\//g, "_")
			.replaceAll("+", "")
			.replaceAll(/\..+$/g, "")
			.toLowerCase()
			.trim();

		return name;
	}

	

	static addPage(page){
		const collection = this.collection;
		collection.set(page.key , page);
		collection.set(page.relativeToPages , page);
		collection.set(page.source , page);
	}

	static getPageBy(any){
		return this.collection.get(any);
	}

	static get pages(){
		return Object.fromEntries(
			[...this.collection.entries()]
				.map(([any, {key}]) => [any, key.replaceAll("_", "/")])
		);
	}

	static relativeToPage(path){
		const svelteApp = app.svelte;
		return relativeSiteRoot(svelteApp, path);
	}

	static redirect(path){
		app.svelte.document.location.href
			= this.relativeToPage(path);
	}
}



export default PagesRouter;
export { PagesRouter };