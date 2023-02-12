
import Path from 'path';

const ROOT = "static";
const root = Path.join(process.cwd(), ROOT);
const target = "index.html";

const PREFIX = /^\/(?:(?:ru|ua|en)\/)?pages/;


class Route {
	constructor(express){
		express.get(PREFIX, this.get);
	}

	async get(request, responce){
		const targetPath = Path.join(root, target);
		responce.sendFile(targetPath);
	}
}

export default Route;