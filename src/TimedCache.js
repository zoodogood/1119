import { MINUTE } from "#constants/time.js";
import EventEmitter from "node:events";

export class TimedCache {
	static Events = {
		before_clean: "before_clean",
	};
	#cache;
	_timer_id;
	emitter = new EventEmitter();
	timer;
	constructor({ timer = MINUTE * 5 } = {}) {
		this.timer = timer;
	}
	#clean() {
		this.emitter.emit(TimedCache.Events.before_clean, this.#cache);
		this.#cache = undefined;
	}

	#updateTimer() {
		clearTimeout(this._timer_id);
		this._timer_id = setTimeout(() => this.#clean(), this.timer);
	}

	fetch() {
		console.assert(false, "You may to implement fetch() for TimedCache");
	}

	isCached() {
		return !!this.#cache;
	}

	value() {
		this.#updateTimer();
		return (this.#cache ||= this.fetch());
	}
}
