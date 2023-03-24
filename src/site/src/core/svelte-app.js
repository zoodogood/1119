import HashController from '#site/lib/HashController.js';
import { parseDocumentLocate, omit, fetchFromInnerApi } from '#lib/safe-utils.js';
import { createDialog } from '#site/lib/createDialog.js';

import { whenDocumentReadyStateIsComplete } from '#site/lib/util.js';
import enviroment from '#site/enviroment/mod.js';

import PagesURLs from '#static/build/svelte-pages/enum[builded].mjs';
import config from '#config';
import PagesRouter from '#site/lib/Router.js';


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

	yetTokenHeat(){
		if (sessionStorage.tokenHeat < Date.now()){
			return true;
		}

		const HEAT_DELAY = 60_000 * 5;
		sessionStorage.tokenHeat = HEAT_DELAY;
		return false;
	}

	setUserData(user){
		const ignoreKeysList = ["guilds"];
		user = omit(user, (key) => !ignoreKeysList.includes(key));
		return localStorage.setItem("user", JSON.stringify(user));
	}
}

class SvelteApp {

	document = document;
	Date = new Date();
	Hash = this.#createHashController();
	HashData;
	enviroment = enviroment;
	url = parseDocumentLocate(this.document.location);
	PagesURLs = PagesURLs;
	storage = new StorageManager();
	user = this.storage.getUserData();

	constructor(){
		this.lang = this.url.base.lang ?? "ru";
		
		this.#checkOrigin();
		this.#checkExternalUserDataByToken();
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
		const data = (this.HashData ||= {hash: {}});
		data.currentHash = hash;
		Object.assign(data.hash, hash);
	}
	
	async #checkExternalUserDataByToken(){
		await whenDocumentReadyStateIsComplete(this.document);
		
		const token = this.storage.getToken();
		if (!token){
			return;
		}
		
		const yet = this.storage.yetTokenHeat();
		if (yet){
			return;
		}


		const headers = {Authorization: token};
		const user = await fetchFromInnerApi("oauth2/user", {headers})
			.catch(() => {});

		if (!user || typeof user === "string"){
			// to-do: update
			const _key = PagesRouter.getPageBy("oauth").key;
			const link = PagesRouter.relativeToPage(_key);
			createDialog(svelteApp, {
				title: "Пожалуйста, авторизуйтесь повторно",
				description: `Токен действителен в течении двух недель и становится недействительным. Чтобы его обновить авторизуйтесь повторно; Если это сообщение возникает чаще указаного срока, сообщите о проблеме для её решения.\n\n<a href = ${ link }>${ _key }</a>`,
				isHTMLAccepted: true
			});
			return;
		}

		this.storage.setUserData(user);
	}
}

const svelteApp = new SvelteApp();

export default svelteApp;
export { svelteApp };