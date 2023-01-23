import EventsEmitter from 'events';

class Executer {
	static emitter = new EventsEmitter();

	static parseCustomId(customId){
		// input example: @command/snippet/example:1:2
		const [_full, key, target, parameters] = customId.match(/^@(.+?)\/(.+?)\/(.+?)$/) ?? [];
		if (!key){
			return null;
		}

		return [key, target, parameters];
	}

	static emit(key, target, parameters){
		this.#constructors[key](target, parameters);
	}

	static bind(key, callback){
		this.#constructors[key] = callback;

	}

	static #constructors = {};
}

export { Executer };
export default Executer;