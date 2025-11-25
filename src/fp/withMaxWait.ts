import { SECOND } from '#src/constants/time.js'
import { TimeoutException } from '#src/fp/Error/variants/TimeoutException.js'

export function timeoutExceptionAt( delay : number , message : string , cleanupTimerOn ?: Promise<unknown> ) {
	const { promise , reject } = Promise.withResolvers()
	const _timerId = setTimeout( () => reject( new TimeoutException( message ) ) , delay )
	cleanupTimerOn?.finally( () => clearTimeout( _timerId ) )
	return promise
}
export function withMaxWait<T>( promise : Promise<T> , maxTimeout = SECOND , message : string ) : Promise<T> {
	if ( Bun?.peek.status( promise ) !== 'pending' ) {
		return promise
	}
	return Promise.race( [ promise , 
		timeoutExceptionAt( maxTimeout , message , promise )	] ) as Promise<T>
}
