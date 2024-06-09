export const GroupSymbols = [
  { label: "Fix", symbol: "#", alias: ["fix", "bug"] },
  {
    label: "Balance change",
    symbol: "$",
    alias: ["balance", "balance change"],
  },
  {
    label: "Major",
    symbol: "!",
    alias: ["major", "important"],
  },
  { label: "Add feature", symbol: "+", alias: ["add feature", "feature"] },
  { label: "Improve", symbol: "%", alias: ["improve"] },
  { label: "Another", symbol: "/", alias: [] },
];

export function group_changes_by_default(flat_with_metadata) {
  return group_changes_by_periods(flat_with_metadata).map(
    ([period, changes]) => [period, group_changes_by_group_symbol(changes)],
  );
}

function group_changes_by_periods(flat_with_metadata) {
  return Object.entries(
    Object.groupBy(flat_with_metadata, ({ period }) => period),
  ).reverse();
}

function group_changes_by_group_symbol(flat_with_metadata) {
  return Object.entries(
    Object.groupBy(flat_with_metadata, ({ group_symbol }) => group_symbol),
  ).map(([group_symbol, changes]) => [
    GroupSymbols.find(({ symbol }) => symbol === group_symbol),
    changes,
  ]);
}

export function change_to_string({ group_symbol, short_change }) {
  return `\`${group_symbol}\` ${short_change}`;
}
