import { BaseRoute } from "#server/router.js";
import FileSystem from 'fs/promises';
import Path from 'path';

const PREFIX = "/site/articles/item/**";


class Route extends BaseRoute {
	prefix = PREFIX;
	directory = "static/articles";

	constructor(express){
		super();
	}

	async get(request, response){
		const path = request.params[0].replace(/\.md$/, "");
		const full = Path.resolve(this.directory, `${ path }.md`);
		try {
			const content = String(await FileSystem.readFile(full));
			response.json( content );
		}
		catch (error){
			if (error.code !== "ENOENT"){
				throw error;
			}

			response.status(404).send();
		}
		
	}

	async post(request, response){

	}

	async delete(request, response){

	}
}

export default Route;