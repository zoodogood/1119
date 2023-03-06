import 'dotenv/config';

import config from '#config';
import express from './express.js';
import FileSystem from 'fs/promises';
import { setMiddleware } from './middleware.js';


import { checkPort, getAddress } from './util.js';
import { sleep } from '#lib/util.js';
import { updateSSL } from './updateSSL.js';

const SSLSecret = config.server.hasSSLCertificate
	&& (await Promise.all([
		FileSystem.readFile("./folder/SSLSecret/server.key"),
		FileSystem.readFile("./folder/SSLSecret/server.crt")
	]))
	.map(String);


async function raiseServer(port){
	while (true){
		const isOpen = await checkPort(port);
		if (isOpen){
			break;
		}

		port++;
	}

	
	return await new Promise(async (resolve, reject) => {
		config.server.hasSSLCertificate && updateSSL();
		const HTTPBase = (config.server.hasSSLCertificate ? (await import("https")).default : (await import("http")).default);
		const options = {
			port,
			host: config.server.hostname,
			key: SSLSecret.at?.(0),
  			cert: SSLSecret.at?.(1)
		};
		
		const server = HTTPBase.createServer(options, express);
		server.listen(options, () => resolve(server));

		
		await sleep(3_000);
		reject( new Error("TIMEOUT ERROR") );
	})
}

function logger(server){
	const address = getAddress(server);
	console.info(`Listen on ${ address }`);
}

export default async () => {
	if (!config.server.isAvailable){
		return null;
	}

	
	const { router } = await setMiddleware( express );


	const port = config.server.port ?? 8001;
	const server = await raiseServer(port);
	
	server.router = router;
	
	logger(server);
	return server;
}




