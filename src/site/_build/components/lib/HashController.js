import { store as reactiveURL } from '#src/site/_build/components/lib/reactiveHref.js'
import { writable } from 'svelte/store'

class HashController {
	static reactiveURL = reactiveURL

	store = null

	#subscribed = false

	#unsubscribe = null

	constructor() {
		this.hash = this.constructor.reactiveURL.get().hash
	}

	apply() {
		document.location.hash = this.hash
		return this
	}

	assign( content ) {
		const entries = this.parse( this.hash )
		const value = Object.assign( Object.fromEntries( entries ) , content )

		this.hash = this.join( Object.entries( value ) )
		return this
	}

	get( key ) {
		const entries = this.parse( this.hash )
		return entries.find( entrie => entrie.at( 0 ) === key )?.at( 1 ) ?? null
	}

	include( { key , value } ) {
		const entries = this.parse( this.hash )
		const exists = entries.find( entrie => entrie.at( 0 ) === key )
		if ( exists ) {
			exists[ 1 ] = value
		}

		if ( !exists ) {
			entries.push( [ key , value ] )
		}

		this.hash = this.join( entries )
		return this
	}

	join( entries ) {
		const string = entries
			.filter( ( [ key ] ) => !!key )
			.map( ( [ key , value ] ) => ( value ? [ key , value ].join( '=' ) : key ) )
			.join( '&' )

		return `#${ string }`
	}

	parse( hash ) {
		return hash
			.slice( 1 )
			.split( '&' )
			.map( string => string.split( '=' ) )
	}

	remove( key ) {
		const entries = this.parse( this.hash )
		const index = entries.findIndex( entrie => entrie.at( 0 ) === key )
		if ( ~index === 0 ) {
			return this
		}

		entries.splice( index , 1 )

		this.hash = this.join( entries )
		return this
	}

	subscribe() {
		if ( this.#subscribed ) {
			return this
		}

		this.store = writable()
		this.#subscribed = true
		this.#unsubscribe = this.constructor.reactiveURL.subscribe( ( URL ) => {
			this.hash = URL.hash
			this.store.update( () => Object.fromEntries( this.parse( this.hash ) ) )
		} )
		return this
	}

	sync() {
		this.hash = document.location.hash
		return this
	}

	unsubscribe() {
		this.#unsubscribe()
		return this
	}
}

export { HashController }
export default HashController
