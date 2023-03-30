import { ButtonStyle, ComponentType } from 'discord-api-types/v10';
import { dayjs, resolveGithubPath } from '#lib/util.js';
import Path from 'path';
import FileSystem from 'fs';
import { Collection } from '@discordjs/collection';
import { stringify } from 'flatted';
import config from '#config';


class ErrorsDataCache {
	#cache = new Map();
	constructor(Audit){
		this.Audit = Audit;
		this.update();
	}

	async update(){
		const files = await this.Audit.fetchLogs();
		for (const name of files){
			this.#addToCache(name);
		} 
	}

	getBulk(){
		return Object.fromEntries(
			[...this.#cache.entries()]
		);
	}

	async get(name){
		const cache = this.#cache;
		name = this.normalizeName(name);
		!cache.has(name) && await this.#addToCache(name);

		return cache.get(name);
	}

	normalizeName(name){
		if (name.endsWith(".json")){
			name = name.replace(/\.json$/, "");
		}
		return name;
	}

	async #addToCache(name){
		name = this.normalizeName(name);
		const data = JSON.parse(await this.Audit.readFile(`${ name }.json`));
		const errors = data.map(errorData => errorData.at(0));
		this.#cache.set(name, errors);
	}
}



class ErrorsAudit {
	collection = new Collection();

	static file = {
		directory: `${ process.cwd() }/folder/data/errors`,
		write(data){
			const date = dayjs().format("DD-MM-HH-mm");
		  	const path = `${ this.directory }/${ date }.json`;
			
		  	data = JSON.stringify(data);
		  	FileSystem.writeFileSync(path, data);
		},
		async readFile(fileName){
			const path = `${ this.directory }/${ fileName }`;
			return await FileSystem.promises.readFile(path);
		},
		async getFilesList(){
			return await FileSystem.promises.readdir(this.directory);
		}
	 }
  

	listOf(key){
		if (!this.collection.has(key)){
			this.collection.set(key, []);
		}
		return this.collection.get(key);
	}

	push(error, context){
		const list = this.listOf(error.message);
		context &&= stringify(context);
		const stack = error.stack;
		list.push({stack, context, timestamp: Date.now()});

		
		config.development && console.error(error);
	}

	createLog(){
		if (this.collection.size === 0){
			return false;
		}

		this.constructor.file.write(
			this.toJSON()
		);
	}

	toJSON(){
		return [...this.collection.entries()];
	}

	async fetchLogs(){
		return (await this.constructor.file.getFilesList())
			.filter(name => name.endsWith(".json"));
	}

	async readFile(name){
		return this.constructor.file.readFile(name);
	}
};





class ErrorsHandler {
	static Audit = new ErrorsAudit();
	static CacheData = new ErrorsDataCache(this.Audit);

	static async sendErrorInfo({channel, error, interaction = {}, description = ""}){
		const { fileOfError, strokeOfError } = this.parseErrorStack(error.stack, {node_modules: false}) ?? {};

		const components = [
			{
			  	type: ComponentType.Button,
			  	style: ButtonStyle.Secondary,
			  	label: "Получить отчёт",
			  	customId: "getErrorInfo",
			  	emoji: "〽️"
			},
			{
			  	type: ComponentType.Button,
			  	style: ButtonStyle.Link,
			  	label: "В Github",
			  	url: resolveGithubPath(
					Path.relative(process.cwd(), fileOfError ?? "."),
					strokeOfError
			  	),
				disabled: !fileOfError
			}
	  	];
		const embed = {title: `— Данные об исключении 🙄\n >>> ${ error.message }`, description, color: "#f0cc50", components, reference: interaction.message?.id ?? null};
		const message = await channel.msg(embed);
	  
		const collector = message.createMessageComponentCollector({time: 3_600_000});
		collector.on("collect", async interaction => {
			interaction.msg({ephemeral: true, content: `\`\`\`js\n${ error.stack }\`\`\``});
		})
		collector.on("end", () => message.edit({components: []}));
	}

	static parseErrorStack(stack, {node_modules}){
		stack = decodeURI(stack).replaceAll("\\", "/");

		const projectPath = process.cwd().replaceAll("\\", "/");
		const regular = new RegExp(`(?<fileOfError>${ projectPath }/.+?\\.js):(?<strokeOfError>\\d+)`);
		const groups = stack.match(regular)?.groups;

		
		if (!groups){
			return undefined;
		}

		const { fileOfError } = groups;
		
		if (node_modules === false && fileOfError.includes("node_modules")){
			return null;
		}

		return {...groups};
	}
}

 
export default ErrorsHandler;