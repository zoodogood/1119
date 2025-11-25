import type { StorageManagerConstructor } from '#src/data/StorageManager/StorageManager.js'

export interface FlushableConfiguration<T> {
	serializer: { write: ( v : T ) => string , read: ( v : string ) => T } | false
	defaultValue: () => T
	cacheStrategy: 'in-memory' | 'no-cache'
	flush: 'manually' | 'on-update'
}

export class Flushable<T> {
	cacheStrategy: FlushableConfiguration<T>['cacheStrategy']
	defaultValue: FlushableConfiguration<T>['defaultValue']
	serializer: FlushableConfiguration<T>['serializer']

	value: T

	constructor( public name : string , public driver : StorageManagerConstructor , { serializer , defaultValue , cacheStrategy = 'in-memory' } : FlushableConfiguration<T> ) {
		this.serializer = serializer
		this.defaultValue = defaultValue
		this.cacheStrategy = cacheStrategy
		this.name = name
		this.driver = driver
	}

	flush( value : T ) {
		this.value = value
	}

	manuallySaveToDrive() {
		return this.driver.write( this.name , this.value )
	}

	async read() : Promise<T> {
		return this.value ?? ( this.cacheStrategy
			? this.flush( await this.driver.readOrDefault( this.name , this.defaultValue ) )
			: await this.driver.readOrDefault( this.name , this.defaultValue ) )
	}

	async update( updateFn : ( previous : T ) => T ) {
		this.flush( updateFn( await this.read() ) )
	}
}
