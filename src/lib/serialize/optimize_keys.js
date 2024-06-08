// # serialize/optimize_keys.js

export function from_short(data, table) {
  const reversed_table = Object.entries(table).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
  }, {});
  return keys_recursive_map(data, (key) => reversed_table[key] || key);
}

export function short(data, table) {
  return keys_recursive_map(data, (key) => table[key] || key);
}

function keys_recursive_map(data, transformer) {
  if (data === null || typeof data !== "object") {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => keys_recursive_map(item, transformer));
  }

  return Object.entries(data).reduce((acc, [key, value]) => {
    acc[transformer(key, value)] = keys_recursive_map(value, transformer);
    return acc;
  }, {});
}
