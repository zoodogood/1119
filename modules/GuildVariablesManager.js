

class GuildVariablesManager {
	#data;
	constructor(guildData){
		guildData.variablesList ||= {};
		this.#data = guildData.variablesList;
	}

	get data(){
		return this.#data;
	}

	static LIMIT = 120;
	static LENGTH_LIMIT = 1024;

	interface = {
		keys: () => {
			return Object.keys(this.#data);
		},
		create: (targetId) => {
			if (typeof targetId === "object"){
				targetId = targetId.id;
			}
			if (!targetId){
				throw new TypeError("Expected id");
			}

			this.#data[targetId] ||= {};
			return this.#data[targetId];
		},
		listOf: (targetId) => {
			return this.#data[targetId] ?? null;
		},
		entriesOf: (targetId) => {
			return Object.entries(this.interface.listOf(targetId) ?? {});
		},
		get: (targetId, name) => {
			const target = targetId in this.#data ? this.#data[targetId] : this.interface.create(targetId);
			return target[name] ?? null;
		},
		set: (targetId, name, value) => {
			const limit = this.constructor.LIMIT;
			const lengthLimit = this.constructor.LENGTH_LIMIT;

			if (value.length + name.length > lengthLimit){
				throw new RangeError(`Limit ${ lengthLimit } symbols`);
			}
			const target = targetId in this.#data ? this.#data[targetId] : this.interface.create(targetId);
			target[name] = value ? String(value) : null;

			if (Object.keys(target).length >= limit){
				delete target[name];
				throw new RangeError(`Limit ${ limit } variables on people`);
			}

			return target[name];
		},
		increase: (targetId, name, value) => {
			const current = +this.interface.get(targetId, name) ?? 0;
			return this.interface.set(targetId, name, current + Number(value));
		},
		remove: (targetId, name) => {
			const target = targetId in this.#data ? this.#data[targetId] : this.interface.create(targetId);
			return delete target[name];
		}
	}
}

export default GuildVariablesManager;