// # sanitize/optimize_keys.js

import { entries_recursive_map } from "#lib/sanitize/recursive_map2.js";

export function from_short(object, table) {
  const reversed_table = Object.entries(table).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
  }, {});

  return entries_recursive_map(object, (key, value) => [
    reversed_table[key] || key,
    value,
  ]);
}

export function short(object, table) {
  return entries_recursive_map(object, (key, value) => [
    table[key] || key,
    value,
  ]);
}
