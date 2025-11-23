export class ImplementError extends Error {
	constructor(message){
		super(message)
		this.name = "ImplementError"
	}
}