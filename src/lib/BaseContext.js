import EventsEmitter from "events";

export class BaseContext {
  guild = null;
  channel = null;
  user = null;
  emitter = new EventsEmitter();
  constructor(_source, primary) {
    Object.assign(this, primary, { _source, primary });
  }

  toSafeValues() {}
}
