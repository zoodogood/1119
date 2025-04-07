import { SECOND } from '#constants/time.js'

export function process_startedAt() {
	return ( globalThis.__app__utils__process_startedAt__value ||= Math.floor(
		Date.now() / SECOND - process.uptime() ,
	) )
}
