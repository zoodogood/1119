import 'dotenv/config';

import config from '#src/config';
import express from './express.js';
import Router from './router.js';

import { checkPort } from './util.js';

const raiseServer = async (port) => {
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
	const router = await new Router().fetch();
	router.bind(express);


	const port = config.port ?? 8001;
	const server = await raiseServer(port);
	
	
	logger(server);
	return server;
}




