import HashController from '#site/lib/HashController.js';
import { resolveDate } from '#lib/safe-utils.js';
import enviroment from '#site/enviroment/mod.js';
import { Collection } from '@discordjs/collection';
import config from '#config';

class App {

	document = document;
	data = {hash: {}};
	Hash = this.#createHashController();
	enviroment = enviroment;
	url = this.#parseDocumentLocate(this.document.location);

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

	#parseDocumentLocate(location){
		const url = location.pathname;

		const key = config.server.paths.site.split("/")
			.at(-1);

		const regex = new RegExp(key);
		const index = (url.match(regex)?.index ?? 0) + key.length;
		const base = url.slice(0, index);
		const subpath = url.slice(index)
			.split("/")
			.filter(Boolean);

		return {
			subpath,
			base: this.#parseLocationBase(base)
		};	
	}

	#parseLocationBase(base){
		typeof base === "string" && (base = base.split("/"));
		base = base.filter(Boolean);

		const entry 	= base.at(-1);
		const lang  	= base.at(-2);
		const prefix   = base.at(-3);
		return {prefix, lang, entry};
	}
	
}

export default new App();