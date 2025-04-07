import { glob } from 'glob'

export class RouterManager {
	routes = []

	async decorate( { params , route , callback } ) {
		try {
			await callback.apply( route , params )
		} catch ( error ) {
			const next = params.at( -1 )
			next( error )
		}
	}

	async fetch() {
		this.loaded = (
			await Promise.all(
				( await glob( '**/*.rest.js' , { absolute: true } ) ).map(
					path => import( path ) ,
				) ,
			)
		).map( ( { default: Route } ) => Route )
		return this.loaded
	}

	getParsedRoutesList() {
		const isRegex = prefix => prefix instanceof RegExp
		const isSimple = prefix =>
			typeof prefix === 'string' && !prefix.match( /[:*\\]/ )
		// to-do: complete a list
		const getMethods = router =>
			[
				'get' in router ? 'get' : null ,
				'post' in router ? 'post' : null ,
				'put' in router ? 'put' : null ,
			].filter( Boolean )

		const parse = router => ( {
			prefix: String( router.prefix ) ,
			isRegex: isRegex( router.prefix ) ,
			isSimple: isSimple( router.prefix ) && router.isSimple !== false ,
			methods: getMethods( router ) ,
		} )
		const isAvailable = router => router.isHidden !== true
		return this.routes.filter( isAvailable ).map( parse )
	}

	register( express , route ) {
		for ( const Route of this.loaded ) {
			const route = new Route( express )
			route.get
			&& express.get( route.prefix , ( ... params ) =>
				this.decorate( { params , route , callback: route.get } ) )

			route.post
			&& express.post( route.prefix , ( ... params ) =>
				this.decorate( { params , route , callback: route.post } ) )

			route.put
			&& express.post( route.prefix , ( ... params ) =>
				this.decorate( { params , route , callback: route.put } ) )

			this.routes.push( route )
		}
	}
}

export default RouterManager
