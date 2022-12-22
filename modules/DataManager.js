import {Guild, User} from 'discord.js';
import FileSystem from 'fs';

class DataManager {

	static getUser(id){
	  const createUser = (id) => {
		 const user = this.#client.users.cache.get(id);
		 const data = {"id": id, name: user?.username ?? null, coins: 50, level: 1, exp: 0, berrys: 1, chestLevel: 0, void: 0, keys: 0, voidRituals: 0, voidCoins: 0};
		 this.data.users.push(data);
		 return data;
	  }
 
	  return this.data.users.find((e) => e.id === id) ?? createUser(id); 
	}
	static getGuild(id){
	  const createGuild = (id) => {
		 const guild = this.#client.guilds.cache.get(id);
		 const data = {"id": id, name: guild?.name ?? null, day_msg: 0, msg_total: 0, days: 0, commandsLaunched: 0, coins: 0, commandsUsed: {}};
		 this.data.guilds.push(data);
		 return data;
	  }
 
	  return this.data.guilds.find((e) => e.id === id) ?? createGuild(id); 
	  
	}
	static extendsGlobalPrototypes(){
	  const manager = this;
 
	  Object.defineProperty(Guild.prototype, "data", {get(){
		 if ("cacheData" in this) {
			return this.cacheData;
		 }
		 const guild = manager.getGuild(this.id);
		 Object.defineProperty(this, "cacheData", {
			value: guild
		 })
		 return guild;
	  }});
	  
	  Object.defineProperty(User.prototype, "data", {get(){
		 if ("cacheData" in this) {
			return this.cacheData;
		 }
		 const user = manager.getUser(this.id);
		 Object.defineProperty(this, "cacheData", {
			value: user
		 })
		 return user;
	  }});
	}

	#client
	static setClient(client){
		this.#client = client;
	}
 
	static file = {
	  path: `${ process.cwd() }/data/main.json`,
	  load: async () => {
		 const path = this.file.path;
		 const content = FileSystem.readFileSync(path, "utf-8");
		 const data = JSON.parse(content);
		 this.data = data;
	  },
	  write: async () => {
		 const path = this.file.path;
		 const data = JSON.stringify(this.data);
		 FileSystem.writeFileSync(path, data);
	  }
	}
 
	static data = {};
 }

 export default DataManager;
