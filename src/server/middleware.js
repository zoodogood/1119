import Router from './router.js';
import cors from 'cors';
import helmet from 'helmet';
import { incrementEnterAPIStatistic } from '#server/util.js';





async function setMiddleware(express){
	const router = await new Router().fetch();
	express.use( cors({origin: "*"}) );

	const HelmetOptions = [
		"crossOriginOpenerPolicy", "crossOriginResourcePolicy", 	  "dnsPrefetchControl",
		"frameguard", 					"hidePoweredBy",
		"hsts",							"ieNoOpen", 						  "noSniff",
		"originAgentCluster",      "permittedCrossDomainPolicies", "referrerPolicy",
		"xssFilter"
	];

	express.use(incrementEnterAPIStatistic);
	
	for (const methodKey of HelmetOptions)
	express.use( helmet[methodKey]() );
	

	router.bindAll(express);

	return { router };
}

export { setMiddleware };