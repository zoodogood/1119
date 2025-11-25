export class TimeoutException extends Error {
	constructor( message ) {
		super( message )
		this.name = 'TimeoutException'
	}
}
