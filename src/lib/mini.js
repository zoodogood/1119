export function factorySummarizeBy(property) {
  return (acc, current) => acc + current[property] ?? 0;
}

export function factorySummarize() {
  return (acc, current) => acc + current;
}

export function factoryGetPropertyValue(...targets) {
  return (x) => {
    let base = x;
    for (const property of targets) {
      base = base[property];
    }
    return base;
  };
}

export function mapGetOrInsert(map, key, defaults) {
  !map.has(key) && map.set(key, defaults);
  return map.get(key);
}

export function capitalize(string) {
  return string.slice(0, 1).toUpperCase() + string.slice(1);
}

export function sortByResolve(array, resolve, { reverse } = {}) {
  return reverse
    ? array.sort((a, b) => resolve(a) - resolve(b))
    : array.sort((a, b) => resolve(b) - resolve(a));
}
