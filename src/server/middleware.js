import Router from './router.js';
import cors from 'cors';
import helmet from 'helmet';

async function setMiddleware(express){
	const router = await new Router().fetch();
	express.use( cors({origin: "*"}) );
	express.use( helmet() )
	router.bindAll(express);

	return { router };
}

export { setMiddleware };