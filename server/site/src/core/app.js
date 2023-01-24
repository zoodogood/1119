import HashController from '#lib/HashController.js';
import {resolveDate} from '#lib/util.js';
import enviroment from '#src/enviroment/mod.js';
import { Collection } from '@discordjs/collection';

class App {

	document = document;
	data = {hash: {}};
	Hash = this.#createHashController();
	enviroment = enviroment;

	constructor(){
		console.info(this);
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

export default new App();