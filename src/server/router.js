import { ImportDirectory } from '@zoodogood/import-directory';
import path from 'path';


const ROOT = "src/server/api";
const directory = path.join(process.cwd(), ROOT);




class Router {
	async fetch(){
		const modules = await new ImportDirectory({subfolders: true})
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