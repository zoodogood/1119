import Router from './router.js';
import cors from 'cors';
import helmet from 'helmet';


async function setMiddleware(express){
	const router = await new Router().fetch();
	express.use( cors({origin: "*"}) );

	express.use(helmet.crossOriginOpenerPolicy());
	express.use(helmet.crossOriginResourcePolicy());
	express.use(helmet.dnsPrefetchControl());
	express.use(helmet.expectCt());
	express.use(helmet.frameguard());
	express.use(helmet.hidePoweredBy());
	express.use(helmet.hsts());
	express.use(helmet.ieNoOpen());
	express.use(helmet.noSniff());
	express.use(helmet.originAgentCluster());
	express.use(helmet.permittedCrossDomainPolicies());
	express.use(helmet.referrerPolicy());
	express.use(helmet.xssFilter());

	router.bindAll(express);

	return { router };
}

export { setMiddleware };