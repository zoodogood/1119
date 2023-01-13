import { Collection } from '@discordjs/collection';

import ErrorsHandler from '#src/modules/ErrorsHandler.js';
import EventsEmitter from 'events';

import { ImportDirectory } from '@zoodogood/import-directory';

const PATH = "./events";


class BaseEvent {
 
	constructor(target, eventName, options = {}){
 
	  this.eventTarget = target;
	  this.eventName   = eventName;
	  this.callback    = this.#beforeRun.bind(this);
 
	  this.isListeningNow = false;
	  this.options = options;
	}
 
	handle(){
 
	  if (this.isListeningNow === true){
		 throw new Error("Listening now");
	  }
 
	  const callback  = this.callback;
	  const eventName = this.eventName;
	  const target    = this.eventTarget;
 
 
	  target.on(eventName, callback);
	  this.isListeningNow = true;
	}
 
	freeze(){
	  this.isListeningNow = false;
	  target.removeListener(eventName, callback);
	}
 
	async #beforeRun(...args){
 
	  	if (this.checkCondition?.(...args) === false)
		 	return;
		
		try {
			await this.run(...args);
		} catch (error){
			console.error(error);
			ErrorsHandler.Audit.push(error, {event: this, target: this.eventTarget});
		}
	}
 
	options = {};
 }
 
 

class EventsManager {

	static emitter = new EventsEmitter();

	static async importEvents(){
		const options = {subfolders: true};
		const events = 
			(await new ImportDirectory(options).import(PATH))
			.map(({default: Event}) => new Event());

		const entries = events.map(event => [event.options.name, event]);

		this.collection = new Collection(entries);
		return this;
	};

	static listen(name){
		this.collection.get(name).handle();
	}

	static listenAll(){
		for (const [_name, event] of this.collection){
			try {
				event.handle?.();
			} catch (error) {
				if (error.message !== "Listening now"){
					throw error;
				}
			}
		}
	}
}


export { EventsManager, BaseEvent };
export default EventsManager;