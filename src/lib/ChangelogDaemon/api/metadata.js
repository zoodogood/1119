import { GroupSymbols } from "#lib/ChangelogDaemon/api/display.js";
import dayjs from "dayjs";

export function metadata(item) {
  const { createdAt, change } = item;
  const period = dayjs(+createdAt).format("MM.YYYY");
  const lowed_change = change.toLowerCase();
  const group_base = GroupSymbols.find(({ alias }) =>
    alias.some((alias) => lowed_change.startsWith(alias)),
  );
  const group_symbol = group_base?.symbol || "/";
  const short_change = group_base ? change.replace(/^.+?:\s*/, "") : change;
  return {
    ...item,
    period,
    group_symbol,
    lowed_change,
    group_base,
    short_change,
  };
}
