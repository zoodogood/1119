import process from 'node:process'
import { useFlushable } from '#src/data/StorageManager/singleton/useFlushable.js'
import { defaultSerializer } from '#src/fp/Flushable/defaultSerializer.js'
import { persistId } from '#src/nodejs/process/persist.js'

export const uptimeLogs = useFlushable( 'uptime-logs.json' , {
	defaultValue: () => [] ,
	cacheStrategy: 'in-memory' ,
	flush: 'on-update' ,
	serializer: defaultSerializer ,
} )

export async function beforeProcessExit() {
	await uptimeLogs.update( v =>
		v.concat( [ process.uptime() , persistId() ] ) ,
	)
}
