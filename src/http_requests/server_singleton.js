import config from "#config";
import { sleep } from "#src/safe-utils.js";
import cors from "cors";
import "dotenv/config";
import helmet from "helmet";
import FileSystem from "node:fs/promises";
import { ErrorsHandler } from "../ErrorsHandler/ErrorsHandler.js";
import { onRequest } from "./api_router/onRequest.js";
import { api_router } from "./api_router/singleton.js";
import { express } from "./express_singleton.js";
import { getAddress } from "./util.js";

/**
 * @param {number} port
 */
async function http_server(port) {
	return await new Promise(async (resolve, reject) => {
		const SSLSecret =
			config.server.hasSSLCertificate &&
			config.server.isAvailable &&
			(
				await Promise.all([
					FileSystem.readFile("./folder/SSLSecret/privkey.pem"),
					FileSystem.readFile("./folder/SSLSecret/cert.pem"),
				])
			).map(String);
		const options = {
			port,
			host: config.server.hostname,
			key: SSLSecret?.[0],
			cert: SSLSecret?.[1],
		};

		const HTTPBase = config.server.hasSSLCertificate
			? (await import("node:https")).default
			: (await import("node:http")).default;
		const server = HTTPBase.createServer(options, express);
		server.listen(options, () => resolve(server));

		await sleep(3_000);
		reject(new Error("TIMEOUT ERROR"));
	});
}

export const server_singleton = await (async () => {
	if (!config.server.isAvailable) {
		return null;
	}

	// middleware ↴
	express.use(cors({ origin: "*" }));
	express.use(onRequest);
	[
		"crossOriginOpenerPolicy",
		"crossOriginResourcePolicy",
		"dnsPrefetchControl",
		"frameguard",
		"hidePoweredBy",
		"hsts",
		"ieNoOpen",
		"noSniff",
		"originAgentCluster",
		"permittedCrossDomainPolicies",
		"referrerPolicy",
		"xssFilter",
	].forEach((key) => express.use(helmet[key]()));
	api_router.register(express);

	try {
		const server = await http_server(config.server.port ?? 8001);
		// success ↴
		console.info(`Listen on ${getAddress(server)}`);
		return server;
	} catch (error) {
		console.error(error);
		console.info("Failed to start server");
		ErrorsHandler.onErrorReceive(error);
		return null;
	}
})();
