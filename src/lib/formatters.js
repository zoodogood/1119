import { toFixedAfterZero } from "#lib/safe-utils.js";

export function percent_string(normalized) {
  if (!normalized) {
    return NaN;
  }
  return `${toFixedAfterZero(normalized * 100, 1)}%`;
}

export function crop_string(text, max_length) {
  if (text.length <= max_length) {
    return text;
  }
  return `${text.slice(0, max_length - 3)}...`;
}
