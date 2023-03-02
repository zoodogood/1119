import 'dotenv/config';

import config from '#config';
import express from './express.js';
import Router from './router.js';
import cors from 'cors';
import helmer from 'helmer';

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
	express.use( cors({origin: "*"}) );
	express.use( helmer() )
	router.bindAll(express);


	const port = config.port ?? 8001;
	const server = await raiseServer(port);
	
	server.router = router;
	
	logger(server);
	return server;
}




