import HashController from '#site/lib/HashController.js';
import { resolveDate, parseDocumentLocate } from '#lib/safe-utils.js';
import enviroment from '#site/enviroment/mod.js';

import PagesEnum from '#static/build/svelte-pages/enum[builded].mjs';


class SvelteApp {

	document = document;
	data = {hash: {}};
	Hash = this.#createHashController();
	enviroment = enviroment;
	url = parseDocumentLocate(this.document.location);
	PagesEnum = PagesEnum;

	constructor(){
		this.lang = this.url.base.lang ?? "ru";
		
		console.info(this);
	}

	get href(){
		return this.document.location.href;
	}


	#createHashController(){
		const controller = new HashController().subscribe();
		controller.store.subscribe(this.#onHashUpdate.bind(this));
		return controller;
	}

	#onHashUpdate(hash){
		const data = this.data;
		data.currentHash = hash;
		Object.assign(data.hash, hash);

		data.Date = resolveDate(data.currentHash.day, ...(data.currentHash.date?.split(".") ?? []));
	}
	
}

export default new SvelteApp();