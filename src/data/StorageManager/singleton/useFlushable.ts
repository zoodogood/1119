import type { FlushableConfiguration } from '#src/fp/Flushable/Flushable.js'
import StorageManager from '#src/data/StorageManager/singleton/index.js'
import { Flushable } from '#src/fp/Flushable/Flushable.js'

export function useFlushable<T>( name : string , options : FlushableConfiguration<T> ) {
	return new Flushable( name , StorageManager , options )
}
