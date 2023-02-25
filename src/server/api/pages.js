
import { BaseRoute } from '#server/router.js';
import Path from 'path';

const ROOT = "static";
const root = Path.join(process.cwd(), ROOT);
const target = "index.html";

const PREFIX = /^\/(?:(?:ru|ua|en)\/)?pages/;


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, response){
		const targetPath = Path.join(root, target);
		response.sendFile(targetPath);
	}
}

export default Route;