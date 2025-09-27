class Cooldown {
	constructor( target , key , { heat = 1 , perCall = null } ) {
		this.key = key
		this.target = target
		this.loadPerCall = perCall
		this.heat = heat
	}

	heatsReady() {
		const endAt = this.loadFullyEndAt()
		return Math.floor( ( endAt - Date.now() ) / this.loadPerCall )
	}

	isOverloaded() {
		return this.overload() > 0
	}

	loadFullyEndAt() {
		return this.target[ this.key ]
	}

	onCall() {
		const previous = Math.max( Date.now() , this.loadFullyEndAt() ?? 0 )
		this.setLoadFullyEndAt( previous + this.loadPerCall )
		return this
	}

	overload() {
		return this.overloadEndsAt() - Date.now()
	}

	overloadEndsAt() {
		const current = this.loadFullyEndAt()
		const threshold = current - this.loadPerCall * ( this.heat - 1 )
		return threshold || 0
	}

	setLoadFullyEndAt( timestamp ) {
		this.target[ this.key ] = timestamp
		return this
	}
}

class CooldownManager {
	static api( target , key , { heat = 1 , perCall = null } = {} ) {
		return new Cooldown( target , key , { heat , perCall } )
	}
}

export default CooldownManager
