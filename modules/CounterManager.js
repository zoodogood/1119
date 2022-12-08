import FileSystem from 'fs';
import Template from '#src/modules/Template.js';

class CounterManager {

	static create(counter){
	  this.data.push(counter);
	  this.call(counter);
	  this.file.write();
 
	  return counter;
	}
 
	static delete(counterOrIndex){
	  const index = typeof counterOrIndex == "number" ?
		 counterOrIndex :
		 this.counterData.indexOf(counterOrIndex);
		 
	  if (~index === 0){
		 return false;
	  }
 
	  this.data.splice(index, 1);
	  this.file.write();
	}
 
	static async *createGenerator(){
	  let i = 0;
	  const MINUTE = 60_000;
	  const MINUTES = 15;
 
	  while (true) {
		 const counter = this.data[i];
		 yield this.call(counter);
 
		 await Util.sleep(MINUTE * MINUTES / (this.data.length + 1));
		 i++;
		 i %= this.data.length;
	  }
	}
 
	static async handle(){
	  const queue = this.createGenerator();
	  for await (const _counter of queue){}
	}
 
	static async call(counter){
	  if (!counter){
			return;
	  }
 
	  const callbacks = {
		 message: async (channel) => {
			const message = await channel.messages.fetch(counter.messageId);
			message.msg({edit: true, ...counter.message});
		 },
 
		 channel: async () => {
			await channel.setName(value, `!commandInfo Counter, initialized by <@${ counter.authorId }>`);
		 },
 
		 poster: async () => {
			await channel.msg(counter.message);
		 }
	  }
 
 
	  try {
		 const channel = client.guilds.cache.get(counter.guildId).channels.cache.get(counter.channelId);
		 const templater = new Template();
		 if ("message" in counter){
			const messageOptions = counter.message;
			if (messageOptions.title){
			  messageOptions.title = await templater.replaceAll(messageOptions.title);
			}
 
			if (messageOptions.description){
			  messageOptions.description = await templater.replaceAll(messageOptions.description);
			}
			
			if (messageOptions.content){
			  messageOptions.content = await templater.replaceAll(messageOptions.content);
			}
		 };
 
		 await callbacks[counter.type].call(null, channel);
	  }
	  catch (error) {
		 console.error(error);
		 this.delete(counter);
	  }
	  return;
	}
 
	static file = {
		 path: `${ process.cwd() }/data/counters.json`,
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
 

 
 export default CounterManager;