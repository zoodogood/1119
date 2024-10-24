export function keys_recursive_map(object, fn) {
  if (object === null || typeof object !== "object") {
    return object;
  }
  if (Array.isArray(object)) {
    return object.map((item) => keys_recursive_map(item, fn));
  }

  return Object.entries(object).reduce((acc, [key, value]) => {
    acc[fn(key, value)] = keys_recursive_map(value, fn);
    return acc;
  }, {});
}
