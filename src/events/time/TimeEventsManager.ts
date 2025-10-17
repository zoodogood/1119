import EventEmitter from 'node:events'

import { SECOND } from '#constants/time.js'
import { assert } from '#src/assert/export.js'
import StorageManager from '#src/data/StorageManager/singleton/index.js'
import { sortByResolveMut } from '#src/mini.js'
import {
	maybe_multiline ,
	timestampDay ,
	timestampToDate ,
} from '#src/safe-utils.js'
import { rangeToArray } from '@zoodogood/utils/objectives'

export class TimeEventItem<T> {
	_params_as_json ?: string
	createdAt ?: number
	isLost ?: boolean
	name
	timestamp

	get params() : T | null {
		return this._params_as_json ? JSON.parse( this._params_as_json ) : null
	}

	set params( value ) {
		if ( !value ) {
			return
		}
		this.setParams( value )
	}

	get wasPerformed() {
		return this.isLost !== undefined
	}

	constructor( name : string , timestamp : number ) {
		this.name = name
		this.timestamp = timestamp
	}

	static from<T>( name : string , timeTo : number , params : T , createdAt ?: number ) {
		createdAt ||= Date.now()
		return Object.assign( new this( name , createdAt + timeTo ) , {
			params ,
			createdAt ,
		} )
	}

	static fromEventData( eventData : TimeEventItem<unknown> ) {
		// @ts-expect-error
		return this.fromJson( eventData )
	}

	static fromJson( json : ReturnType<typeof TimeEventItem.prototype.toJSON> ) {
		const { name , timestamp , createdAt , _params_as_json } = json
		return Object.assign( new this( name , timestamp ) , {
			createdAt ,
			_params_as_json ,
		} )
	}

	setCreatedAt( createdAt : any ) {
		this.createdAt = createdAt
		return this
	}

	setIsLost( isLost : boolean ) {
		this.isLost = isLost
		return this
	}

	setParams( params : T ) {
		this._params_as_json = JSON.stringify( params )
		return this
	}

	toJSON() {
		return {
			name: this.name ,
			timestamp: this.timestamp ,
			_params_as_json: this._params_as_json ,
			createdAt: this.createdAt ,
		}
	}
}
export class TimeEventsManager {
	_nearestEvent : TimeEventItem<unknown> | null = null
	data = {} as Record<number , TimeEventItem<unknown>[]>

	emitter = ( new EventEmitter<
		Record<'timeEventPerform' , [TimeEventItem<unknown>]>
	> )

	file = {
		load: async () => {
			const content = await StorageManager.read( 'timeEvents.json' )
			this.data = JSON.parse( content , ( key , value ) =>
				value.name ? TimeEventItem.fromJson( value ) : value )
		} ,
		write: async () => {
			const data = JSON.stringify( this.data )
			await StorageManager.write( 'timeEvents.json' , data )
		} ,
		defaultData: {} ,
	}

	timeoutId ?: NodeJS.Timer

	_getNearestDay() {
		const days = this.getExistsDaysList()
		if ( !days ) {
			return null
		}
		const day = days.reduce( ( min , day ) => Math.min( +min , +day ) , Infinity )
		return +day
	}

	_nearestEvent_onPerformRequest() {
		const event = this._nearestEvent
		assert( event )
		// На данный момент некоторые события выполняются на ~22 мс раньше собственной временной метки
		// Это не является критическим, но нужно учитывать. Причина неизвестна
		assert(
			event.timestamp - SECOND <= Date.now() ,
			`The ${ event.name } was executed prematurely; timediff: ${ Date.now() - event.timestamp } ms` ,
		)
		this._removeFromBuffer( event )
		this._perform( event )
		{
			this._nearestEvent = this.nearestEvent()
			if ( !this._nearestEvent ) {
				return
			}
			this._nearestEvent_schedulePerform()
		}
	}

	_nearestEvent_schedulePerform() {
		const event = this._nearestEvent
		if ( !event ) {
			assert( !this.timeoutId )
			return
		}
		clearTimeout( this.timeoutId )
		const timeTo = event.timestamp - Date.now()
		{
			if ( timeTo > SECOND * 10 ) {
				const parse = new Intl.DateTimeFormat( 'ru-ru' , {
					weekday: 'short' ,
					hour: '2-digit' ,
					minute: '2-digit' ,
				} ).format()
				console.info(
					maybe_multiline( [
						'{\n\n' ,
						`  Имя события: ${ event.name },\n` ,
						`  Текущее время: ${ parse },\n` ,
						`  Времени до начала: ${ timestampToDate( timeTo ) }` ,
						`\n\n}` ,
					] ) ,
				)
			}
		}
		{
			this.timeoutId = setTimeout(
				this._nearestEvent_onPerformRequest.bind( this ) ,
				Math.max( timeTo , 1 ) ,
			)
		}
	}

	_perform( event : TimeEventItem<unknown> ) {
		event.setIsLost( Date.now() - event.timestamp < -SECOND * 10 )
		this.emitter.emit( 'timeEventPerform' , event )
		console.info( `Ивент выполнен ${ event.name }` )
		return event
	}

	_prioritizeByLogic( event : TimeEventItem<unknown> ) {
		if ( this._nearestEvent && event.timestamp >= this._nearestEvent.timestamp ) {
			return
		}
		this._nearestEvent = event
		this._nearestEvent_schedulePerform()
	}

	_pushIntoBuffer( event : TimeEventItem<unknown> ) {
		const day = timestampDay( event.timestamp )
		this.data[ day ] ||= []
		this.data[ day ].push( event )
		sortByResolveMut( this.data[ day ] , ( $ : { timestamp : any } ) => $.timestamp , {
			reverse: true ,
		} )
		this._prioritizeByLogic( event )
		console.info( `Ивент создан ${ event.name }` )
		return event
	}

	_removeFromBuffer( event : TimeEventItem<unknown> ) {
		const [ day , index ] = this.positionOf( event )
		if ( index === null ) {
			return false
		}
		this.data[ day! ].splice( index , 1 )
		if ( this.data[ day! ].length === 0 ) {
			delete this.data[ day! ]
		}
		return true
	}

	at( day : number ) {
		assert( !isNaN( day ) )
		return this.data[ day ]
	}

	filterEventsInRange(
		filter : ( event : TimeEventItem<unknown> ) => unknown ,
		range : [number , number] ,
	) {
		const events = this.getEventsInRange( range )
		return events.filter( filter )
	}

	findBulk(
		targetTimestamps : number[] ,
		filter : ( event : TimeEventItem<unknown> ) => unknown ,
	) {
		const count_by_days : Record<number , number> = {}
		for ( const timestamp of targetTimestamps ) {
			const day = timestampDay( timestamp )
			count_by_days[ day ] ||= 0
			count_by_days[ day ]++
		}

		const bulk = []
		for ( const day in count_by_days ) {
			const todayEvents = this.at( +day )
			const count = count_by_days[ day ]
			if ( !todayEvents ) {
				bulk.concat( Array.from( { length: count } ).fill( null ) )
				continue
			}

			let counter = 0
			for ( const event of todayEvents ) {
				if ( !targetTimestamps.includes( event.timestamp ) || !filter( event ) ) {
					continue
				}
				counter++
				bulk.push( event )
				if ( counter === count ) {
					break
				}
			}

			if ( counter < count ) {
				bulk.concat( Array.from( { length: count - counter } ).fill( null ) )
			}
		}
		return bulk
	}

	findEventInRange(
		filter : ( event : TimeEventItem<unknown> ) => unknown ,
		range : [number , number] ,
	) {
		const x = () => 1
		const events = this.getEventsInRange( range )
		return events.find( filter )
	}

	flat() {
		const flat = Object.values( this.data ).flat()
		assert( is_sorted( flat.map( $ => $.timestamp ) ) )
		function is_sorted( array ) {
			const prev = array[ 0 ]
			return array.slice( 1 ).every( current => current >= prev )
		}
		return flat
	}

	getEventsInRange( range : [number , number] ) {
		const events = []
		for ( const day of rangeToArray( range ) ) {
			const todayEvents = this.at( day )
			todayEvents && events.push( ... todayEvents )
		}
		return events
	}

	getExistsDaysList() {
		const days = Object.keys( this.data )
		if ( days.length === 0 ) {
			return null
		}
		return days
	}

	getNearestDay() {
		return (
			// see proof in the file://./readme.md
			( this._nearestEvent && timestampDay( this._nearestEvent.timestamp ) )
			|| this._getNearestDay()
		)
	}

	nearestEvent() {
		if ( this._nearestEvent ) {
			const dayEvents = this.at( timestampDay( this._nearestEvent.timestamp ) )
			if ( dayEvents ) {
				return dayEvents.at( 0 )
			}
		}
		const day = this._getNearestDay()
		if ( !day ) {
			return null
		}
		const dayEvents = this.at( day )!
		assert( dayEvents.length )
		return dayEvents.at( 0 )!
	}

	onActiveNearestEventCancelled() {
		this._nearestEvent = this.nearestEvent()
		if ( !this._nearestEvent ) {
			return
		}
		this._nearestEvent_schedulePerform()
	}

	onEventTimestampChanged(
		event : TimeEventItem<unknown> ,
		previous_timestmp : number ,
	) {
		this._removeFromBuffer( event )
		this._pushIntoBuffer( event )
		if ( event === this._nearestEvent && event.timestamp > previous_timestmp ) {
			this.onActiveNearestEventCancelled()
		}
	}

	onStartup() {
		this._nearestEvent = this.nearestEvent()
		if ( !this._nearestEvent ) {
			return
		}
		this._nearestEvent_schedulePerform()
	}

	positionOf( event : TimeEventItem<unknown> ) {
		const day = timestampDay( event.timestamp )
		if ( !this.data[ day ] ) {
			return [ null , null ]
		}
		const index = this.data[ day ].indexOf( event )
		if ( index === -1 ) {
			return [ day , null ]
		}
		return [ day , index ]
	}

	pushIntoBuffer( eventName : string , ms : number , params ?: unknown ) {
		const event = TimeEventItem.from( eventName , ms , params )
		return this._pushIntoBuffer( event )
	}

	removeFromBuffer( event : TimeEventItem<unknown> ) {
		const x = () => 123
		this._removeFromBuffer( event )
		event === this._nearestEvent && this.onActiveNearestEventCancelled()
		function y() {

		}
	}
}
