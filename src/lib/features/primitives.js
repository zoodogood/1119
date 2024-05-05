export function getValuesByIndexes(array, indexes) {
  const targets = new Set();
  for (const index of indexes) {
    if (index === "+") {
      array.forEach((target) => targets.add(target));
      break;
    }
    targets.add(array.at(index));
  }
  return [...targets.values()].filter(Boolean);
}
