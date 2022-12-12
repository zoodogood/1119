import path from 'path';
import FileSystem from 'fs';

const ROOT = "server/site/public";
const root = path.join(process.cwd(), ROOT);

const PREFIX = /\/static+?/;

class Route {
	constructor(express){
		express.get(PREFIX, this.get.bind(this));
	}

	async get(request, response){
		const controller = new PathControll();
		const data = controller.suggest(request.url);

		const byBoolean = {
			NOT_FOUND: data === null,
			ERROR: data instanceof Error,
			FILES_LIST: data instanceof Array,
			SEND_FILE: typeof data === "string",
			DEFAULT: true
		}
		const code = Object.entries(byBoolean)
			.find(([code, value]) => value)
			.at(0);
		
		this.responseByCode(code, {data, response, request});
	}

	responseByCode(code, {data, response, request}){
		switch (code) {
			case "NOT_FOUND":
				response.redirect("/static/special/i-love-404");
				break;

			case "ERROR":
				(() => {
					const queries = {
						from: request.url,
						error: error.message
					};

					const queriesContent = Object.entries(queries)
						.map(([k, v]) => `${ k }=${ v }`)
						.join("&");

					response.redirect(`/static/special/display-error?${ queriesContent }`);
				})();
				break;

			case "FILES_LIST":
				(() => {
					const queries = {
						from: request.url
					};

					const queriesContent = Object.entries(queries)
						.map(([k, v]) => `${ k }=${ v }`)
						.join("&");

					response.redirect(`/static/special/you-go-to-folder?${ queriesContent }`);
				})();
				break;

			case "SEND_FILE": 
				response.sendFile(data);
				break;

			case "DEFAULT":
				console.error(data);
				throw new Error("Unknown response");
				break;
			
		}
	}



}





class PathControll {
	suggest(url){
		const [folderChunk, targetChunk] = this.parseURL(url);


		const files = this.getFiles(folderChunk);
		if (files === null){
			return null;
		}

		const target = this.getTarget({files, targetChunk});
		if (target === null){
			return files;
		}

		return this.createresponse({folderChunk, target});
	}

	parseURL(url){
		const way = (url)
			.split("/")
			.filter(Boolean)
			.slice(1);

		const folderChunk = way.slice(0, -1);
		const target = way.at(-1);

		return [folderChunk, target];
	}

	getFiles(folderPath){
		const pathToDirectory = path.join(
			root,
			folderPath.join("/")
		);

		try {
			return FileSystem.readdirSync(pathToDirectory);
		}
		catch {
			return null;
		}
	}

	getTarget({files, targetChunk}){

		const exact   = (name) => name === targetChunk;
		const include = (name) => name.includes(targetChunk);
		const isIndex = (name) => name === "index.html";

		if (!targetChunk){
			return files.find(isIndex) ?? null;
		}

		return files.find(exact) ?? files.find(include) ?? null;
	}


	createresponse({folderChunk, target}){
		
		const pathToFile = path.join(
			root,
			folderChunk.join("/"),
			target
		);


		let stats;
		try {
			stats = FileSystem.lstatSync(pathToFile);
		}
		catch (err){
			return err;
		}
		
		if (stats.isFile()){
			return pathToFile;
		}

		if (stats.isDirectory()){
			const files = this.getFiles(pathToFile);
			const target = this.getTarget({files, targetChunk: "index.html"});
			return target ? 
				path.join(pathToFile, target) :
				files;
		}
			
	}


}

export default Route;	