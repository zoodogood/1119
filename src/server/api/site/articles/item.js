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

	async get(request, responce){
		const path = request.params[0].replace(/\.md$/, "");
		const full = Path.resolve(this.directory, `${ path }.md`);
		try {
			const content = String(await FileSystem.readFile(full));
			responce.json( content );
		}
		catch (error){
			if (error.code !== "ENOENT"){
				throw error;
			}

			responce.status(404).send();
		}
		
	}

	async post(request, responce){

	}

	async delete(request, responce){

	}
}

export default Route;