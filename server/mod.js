import 'dotenv/config';

import express from './express.js';
import Router from './router.js';

export default async () => {
	const router = await new Router().fetch();
	router.bind(express);


	const port = process.env.PORT ?? 8080;

	express.listen({ port }, (err, address) => {
	if (err) throw err;

	
	// console.clear();
	console.info(`Listen on http://${ process.env.INSTANCE_HOST || "localhost" }:${ port }/`);
	console.info("Ready...\n\n");
})
}




