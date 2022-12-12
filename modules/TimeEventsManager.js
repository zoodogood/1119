import FileSystem from 'fs';
import EventEmitter from 'events';

import * as Util from '#src/modules/util.js';

class TimeEventsManager {

	static at(day){
		return this.data[day];
	}

	static Util = Util;

	static create(eventName, ms, params){
		const event = {
			name: eventName,
			timestamp: Date.now() + ms,
			params: params ? JSON.stringify(params) : undefined
		};
		const day = this.Util.timestampDay(event.timestamp);

		this.data[day] ||= [];
		this.data[day].push(event);
		this.data[day].sortBy("timestamp");

		this.handle();

		console.info(`Ивент создан ${ event.name }`);
	  	return event;
	}
 
 
	static remove(event){
	  	const day = this.Util.timestampDay(event.timestamp);
		const index = this.data[day].indexOf(event);
		if (~index === 0){
			return false;
		}
		this.data[day].splice(index, 1);

		if (this.data[day].length === 0){
			delete this.data[day];
		}

	  	this.handle();
		return true;
	}
 
	static change(event, data){
	  	this.remove(event);
	  	Object.assign(
			event,
			Util.omit(data, (key) => ["name", "timestamp", "params"].includes(key))
		);
	
	  	this.create(event.name, event.timestamp - Date.now(), event.params);
	  	return event;
	}
	
	static fetchNextEvent(){
		const days = Object.keys(this.data);
		if (days.length === 0){
			return null;
		}

		const day = days
			.reduce((min, day) => Math.min(min, day));

	  	return this.data[day].at(0);
	}

	static handle(){
		this.file.write();

	  	clearTimeout(this.timeout);

	  	const event = this.fetchNextEvent();
	  	if (!event){
			return;
	  	}
	  
	  	const timeTo = event.timestamp - Date.now();
	  	if (timeTo > 10_000){
		 	const parse = new Intl.DateTimeFormat("ru-ru", {weekday: "short", hour: "2-digit", minute: "2-digit"}).format();
		 	console.info(`{\n\n  Имя события: ${ event.name },\n  Текущее время: ${ parse },\n  Времени до начала: ${Util.timestampToDate(timeTo)}\n\n}`);
	  	}
 
	  	this.timeout = setTimeout(this.onTimeout.bind(this), timeTo);
	  	return;
	}

	static onTimeout(){
		const event = this.fetchNextEvent();
		if (!event){
			return;
		}
		if (event.timestamp > Date.now()){
			return this.handle();
		}
		this.remove(event);

		const data = {
			name: event.name,
			isLost: Date.now() - event.timestamp < -10000,
			params: event.params ? JSON.parse(event.params) : undefined
		};
		this.emitter.emit("event", data);
		
		console.info(`Ивент выполнен ${ event.name }`);
		this.handle(); 
	}

	static file = {
		path: `${ process.cwd() }/data/time.json`,
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

	static emitter = new EventEmitter();
	static data = {};
}

export default TimeEventsManager;