export function factorySummarizeBy(property) {
  return (acc, current) => acc + current[property] ?? 0;
}

export function factoryGetPropertyValue(property) {
  return (x) => x[property];
}

export function mapGetOrInsert(map, key, defaults) {
  !map.has(key) && map.set(key, defaults);
  return map.get(key);
}
