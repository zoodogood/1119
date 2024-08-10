import EventsEmitter from "events";

export class BaseContext {
  channel = null;
  createdAt = Date.now();
  emitter = new EventsEmitter();
  guild = null;
  user = null;
  constructor(_source, values) {
    Object.assign(this, values, { _source });
  }

  toJSON() {
    return this.toSafeValues();
  }

  // Expected a toSafeValues will be overridden by the situation
  toSafeValues() {
    return {
      createdAt: this.createdAt,
      source: this._source,
      is: this.constructor.name,
      events: Object.entries(this.emitter._events).map(([key, value]) => [
        key,
        value.length,
      ]),
    };
  }
}
