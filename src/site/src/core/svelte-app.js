import HashController from '#site/lib/HashController.js';
import { resolveDate, parseDocumentLocate, omit } from '#lib/safe-utils.js';
import enviroment from '#site/enviroment/mod.js';

import PagesURLs from '#static/build/svelte-pages/enum[builded].mjs';
import config from '#config';

class StorageManager {
	getToken(){
		return localStorage.getItem("access_token");
	}

	setToken(token){
		return localStorage.setItem("access_token", token);
	}

	getUserData(){
		return JSON.parse(localStorage.getItem("user") ?? null);
	}

	setUserData(user){
		const ignoreKeysList = ["guilds"];
		user = omit(user, (key) => !ignoreKeysList.includes(key));
		return localStorage.setItem("user", JSON.stringify(user));
	}
}

class SvelteApp {

	document = document;
	data = {hash: {}};
	Hash = this.#createHashController();
	enviroment = enviroment;
	url = parseDocumentLocate(this.document.location);
	PagesURLs = PagesURLs;
	storage = new StorageManager();
	user = this.storage.getUserData();

	constructor(){
		this.lang = this.url.base.lang ?? "ru";
		
		this.#checkOrigin();
		console.info(this);
	}

	get href(){
		return this.document.location.href;
	}

	getBot(){
		const bot = this.enviroment.bot ?? {
			id: null,
			username: "Призрак",
			discriminator: "1119",
			displayAvatarURL: `${ config.server.origin }/static/favicon.ico`,
			invite: null
		};

		return bot;
	}

	#checkOrigin(){
		if (config.server.origin !== this.document.location.origin){
			throw new Error(`You need set in config server.origin equal to ${ this.document.location.origin }`);
		}
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

const svelteApp = new SvelteApp();

export default svelteApp;
export { svelteApp };