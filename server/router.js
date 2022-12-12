import { ImportDirectory } from '@zoodogood/import-directory';
import path from 'path';


const ROOT = "server/api";
const directory = path.join(process.cwd(), ROOT);




class Router {
	async fetch(){
		const modules = await new ImportDirectory()
			.import(directory);


		this.routes = modules;

		return this;
	}

	bind(express){
		for (const {default: Route} of this.routes){
			new Route(express);
		} 
	}
}

export default Router;