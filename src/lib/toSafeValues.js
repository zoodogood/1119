function replacer(key, value, context) {
  if (typeof value !== "object" || value === null) {
    return value;
  }

  if (key && "toSafeValues" in value) {
    return value.toSafeValues(key, value, context);
  }

  if (!context.circular.pass(value)) {
    return "[Circular*]";
  }

  return Object.fromEntries(Object.entries().map());
}

export function toSafeValues(target, context) {
  return replacer(null, target, context);
}
