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
			const route = new Route(express);
			this.handle(route, express);
		} 
	}

	handle(route, express){
		route.get && express.get(
			route.prefix,
			(...params) => this.decorate({params, route, callback: route.get})
		);

		route.post && express.post(
			route.prefix,
			(...params) => this.decorate({params, route, callback: route.post})
		);
	}

	async decorate({params, route, callback}){
		try {
			await callback.apply(route, params);
		} catch (error) {
			const next = params.at(-1);
			next(error);
		}
	}
}

class BaseRoute {

}

export default Router;
export { Router, BaseRoute };