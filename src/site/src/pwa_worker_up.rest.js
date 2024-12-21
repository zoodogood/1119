import { BaseRoute } from "#src/http_requests/api_router/BaseRoute.js";

const PREFIX = "/pwa_worker_up";

import Path from "node:path";

const ROOT = "src/public";
const root = Path.join(process.cwd(), ROOT);
const target = "pwa_service_worker.js";

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor() {
		super();
	}

	async get(request, response) {
		const targetPath = Path.join(root, target);
		response.sendFile(targetPath);
	}
}

export default Route;
