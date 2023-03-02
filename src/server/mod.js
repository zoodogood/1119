import 'dotenv/config';

import config from '#config';
import express from './express.js';
import { setMiddleware } from './middleware.js';


import { checkPort } from './util.js';




async function raiseServer(port){
	while (true){
		const isOpen = await checkPort(port);
		if (isOpen){
			break;
		}

		port++;
	}
	

	return await new Promise(async (resolve) => {
		const server = express.listen({ port }, async () => resolve(server));
	})
}

function logger(server){
	const {address, port} = server.address();
	console.info(`Listen on http://${ address === "::" ? "localhost" : address }:${ port }/`);
}

export default async () => {
	const { router } = await setMiddleware( express );


	const port = config.server.port ?? 8001;
	const server = await raiseServer(port);
	
	server.router = router;
	
	logger(server);
	return server;
}




