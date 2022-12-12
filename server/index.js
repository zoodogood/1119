import 'dotenv';

import express from './express.js';
import Router from './router.js';


const router = await new Router().fetch();
router.bind(express);


const port = process.env.PORT ?? 8080;

express.listen({ port }, (err, address) => {
	if (err) throw err;

	
	// console.clear();
	console.log(`Listen on http://${ process.env.INSTANCE_HOST || "localhost" }:${ port }/`);
	console.log("Ready...\n\n");
})



