import { BaseRoute } from "#src/http_requests/api_router/BaseRoute.js";
import path from "node:path";

const PREFIX = /\/public+?/;
const public_dir = path.resolve(process.cwd(), "src/public");

export default class Route extends BaseRoute {
	prefix = PREFIX;

	constructor() {
		super();
	}

	async get(request, response) {
		response.sendFile(
			path.resolve(public_dir, request.path.replace(/^\/public\//, "./")),
			(error) => {
				if (error.code === "ENOENT") {
					response.sendStatus(404);
					return;
				}
				throw error;
			},
		);
	}
}
