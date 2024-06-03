import { MINUTE } from "#constants/globals/time.js";
import EventsEmitter from "events";

export class TimedCache {
  _timer_id;
  #cache;
  emitter = new EventsEmitter();
  static Events = {
    before_clean: "before_clean",
  };
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
