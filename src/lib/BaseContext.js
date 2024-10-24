import EventsEmitter from "events";

// [Unsafe_primitives]: string[]
export const Unsafe_primitives = Symbol("unsafe_primitives");

function to_safe_values_default(values, transformer) {
  const unsafe_primitives = values[Unsafe_primitives];
  const map = ([key, value]) => {
    const newValue =
      value && typeof value === "object"
        ? value.toSafeValues(transformer)
        : !unsafe_primitives || !unsafe_primitives.includes(key);
    return [key, newValue];
  };
  return Object.fromEntries(
    Object.entries(values)
      .map(map)
      .filter(([_key, value]) => value),
  );
}

export class BaseContext {
  channel = null;
  contextedAt = Date.now();
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
    const values = {
      contextedAt: this.contextedAt,
      source: this._source,
      is: this.constructor.name,
      events: Object.entries(this.emitter._events).map(([key, value]) => [
        key,
        value.length,
      ]),
      ...to_safe_values_default(this),
    };
    return values;
  }
}
