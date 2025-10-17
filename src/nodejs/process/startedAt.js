import process from 'node:process'
import { SECOND } from '#constants/time.js'

let _process_startedAt__value
export function startedAt() {
	return ( _process_startedAt__value ||= Math.floor(
		Date.now() / SECOND - process.uptime() ,
	) )
}
