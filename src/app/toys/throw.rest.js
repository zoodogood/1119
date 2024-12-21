import { ErrorsHandler } from "#src/ErrorsHandler/ErrorsHandler.js";
import { BaseRoute } from "#src/http_requests/api_router/BaseRoute.js";
import { parse_body } from "#src/http_requests/express_utils.js";

const PREFIX = "/toys/throw";

class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express) {
		super();
	}

	async get(request, response, next) {
		throw new Error(
			"Error caused automatically from toy api point: Need more coffe",
		);
	}

	async post(request, response, next) {
		const data = JSON.parse(await parse_body(request));
		const { message, stack } = data;
		const error = new Error(message);
		error.stack = stack;
		ErrorsHandler.onErrorReceive(error, { type: "site", cause: data.cause });
	}
}

export default Route;
