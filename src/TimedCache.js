import EventEmitter from 'node:events'
import { MINUTE } from '#constants/time.js'
import { ImplementError } from '#src/fp/Error/variants/ImplementError.js'

export class TimedCache {
	static Events = {
		before_clean: 'before_clean' ,
	}

	_timer_id
	emitter = ( new EventEmitter )
	timer
	#cache
	constructor( { timer = MINUTE * 5 } = {} ) {
		this.timer = timer
	}

	fetch() {
		throw new ImplementError( 'You may to implement fetch() for TimedCache' )
	}

	isCached() {
		return !!this.#cache
	}

	value() {
		this.#updateTimer()
		return ( this.#cache ||= this.fetch() )
	}

	#clean() {
		this.emitter.emit( TimedCache.Events.before_clean , this.#cache )
		this.#cache = undefined
	}

	#updateTimer() {
		clearTimeout( this._timer_id )
		this._timer_id = setTimeout( () => this.#clean() , this.timer )
	}
}
