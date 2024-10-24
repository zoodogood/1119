import { crop_string } from "#lib/formatters.js";
import {
  entries_recursive_map,
  request_remove,
} from "#lib/sanitize/recursive_map2.js";

export function limit_depth_and_lenght(object, max_depth, max_length, filter) {
  return entries_recursive_map(object, (key, value, context) => {
    if (filter && !filter(key, value, context)) {
      return [request_remove];
    }
    const current_depth = context.path.length;

    if (typeof value === "string" && max_length && value.length > max_length) {
      value = crop_string(value, max_length);
    }

    if (!value || typeof value !== "object") {
      return [key, value];
    }

    if (max_depth > 0 && current_depth >= max_depth) {
      value = `DepthLimit*<${value.constructor.name}>`;
      return [key, value];
    }

    const current_length = Array.isArray(value)
      ? value.length
      : Object.keys(value).length;
    if (max_length > 0 && current_length >= max_length) {
      value = Array.isArray(value)
        ? value.slice(0, max_length)
        : Object.fromEntries(Object.entries(value).slice(0, max_length));
    }

    return [key, value];
  });
}
