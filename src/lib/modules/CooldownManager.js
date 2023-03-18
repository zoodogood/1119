class Cooldown {
	constructor(target, key, {heat = 1, perCall = null}){
		this.key = key;
		this.target = target;
		this.perCall = perCall;
		this.heat = heat;
	}


	getCurrentCooldownEnd(){
		return this.target[this.key];
	}

	getCooldownThreshold(){
		const current = this.getCurrentCooldownEnd();
		const threshold = current - this.perCall * (this.heat - 1);
		return threshold || 0;
	}

	setCooldownThreshold(timestamp){
		this.target[this.key] = timestamp;
		return this;
	}

	call(){
		const now = Math.max(Date.now(), this.getCurrentCooldownEnd() ?? 0);
		this.setCooldownThreshold(now + this.perCall);
		return this;
	}

	checkYet(){
		return this.diff() < 0;
	}

	diff(){
		return Date.now() - this.getCooldownThreshold();
	}
}


class CooldownManager {
	static api(target, key, {heat = 1, perCall = null} = {}){
		return new Cooldown(target, key, {heat, perCall});
	}
}


export default CooldownManager;