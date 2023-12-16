export function factorySummarizeBy(property) {
  return (acc, current) => acc + current[property] ?? 0;
}
