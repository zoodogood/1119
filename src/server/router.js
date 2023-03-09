import { ImportDirectory } from '@zoodogood/import-directory';
import path from 'path';


const ROOT = "src/server/api";
const directory = path.join(process.cwd(), ROOT);



class Router {

	routes = [];


	async fetch(){
		const modules = await new ImportDirectory({subfolders: true})
			.import(directory);


		this.fetchedRoutes = modules;

		return this;
	}

	bindAll(express){
		for (const {default: Route} of this.fetchedRoutes){
			const route = new Route(express);
			this.handle(route, express);

			this.routes.push(route);
		} 
	}

	getParsedRoutesList(){
		const isRegex = (prefix) => prefix instanceof RegExp;
		const isSimple = (prefix) => typeof prefix === "string" && !prefix.match(/:|\*|\\/);
		// to-do: complete a list
		const getMethods = (router) => [
			"get" in router ?  "get" : null,
			"post" in router ? "post" : null,
			"put" in router ?  "put" : null
		].filter(Boolean);

		const parse = (router => ({
			prefix: String(router.prefix),
			isRegex: isRegex(router.prefix),
			isSimple: isSimple(router.prefix) && router.isSimple !== false,
			methods: getMethods(router)
		}));
		const isAvailable = (router) => router.isHidden !== true;
		return this.routes.filter(isAvailable).map(parse);
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

class BaseRoute {};

export default Router;
export { Router, BaseRoute };