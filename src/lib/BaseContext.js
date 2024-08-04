import EventsEmitter from "events";

export class BaseContext {
  channel = null;
  emitter = new EventsEmitter();
  guild = null;
  user = null;
  constructor(_source, values) {
    Object.assign(this, values, { _source });
  }

  toSafeValues() {
    throw new Error("toSafeValues is not implemented");
  }
}
