
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

	async get(request, responce){
		const targetPath = Path.join(root, target);
		responce.sendFile(targetPath);
	}
}

export default Route;