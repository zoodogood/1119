import Router from './router.js';
import cors from 'cors';
import helmet from 'helmet';



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
	
	for (const methodKey of HelmetOptions)
	express.use( helmet[methodKey]() );
	

	router.bindAll(express);

	return { router };
}

export { setMiddleware };