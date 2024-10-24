import { CircularProtocol, DotNotatedInterface } from "#lib/safe-utils.js";
import {
  entries_recursive_map,
  request_continue,
  unsanitizible,
} from "#lib/sanitize/recursive_map2.js";

export function sanitize_prevent_circular(object) {
  const checker = new CircularProtocol();
  return entries_recursive_map(object, (key, value, context) => {
    const { path } = context;
    if (checker.pass(value, { attach: [...path, key] })) {
      return [key, value];
    }

    return [key, new CircularReference(checker.collection.get(value))];
  });
}

class CircularReference {
  constructor(path) {
    this.path = path;
  }
  static from_string(string) {
    const source = string.slice(`Circular*<`.length, -1);
    return new CircularReference(source.split("."));
  }
  [Symbol.toPrimitive]() {
    return `Circular*<${this.path.join(".")}>`;
  }
  toJSON() {
    return this[Symbol.toPrimitive]();
  }
  toString() {
    return this[Symbol.toPrimitive]();
  }
  get [unsanitizible]() {
    return true;
  }
}

export function sanitize_restore_circular(object) {
  const checker = new CircularProtocol();
  return entries_recursive_map(object, (key, value, context) => {
    if (value instanceof CircularReference) {
      const source = value.path.join(".");
      const _interface = new DotNotatedInterface(object);
      const target_place = _interface.getItem(source);
      const current_place = _interface.getItem(context.path.join("."));

      current_place[key] = target_place;
      return [key, target_place];
    }
    if (value && typeof value === "object" && !checker.pass(value)) {
      return [request_continue];
    }

    return [key, value];
  });
}
