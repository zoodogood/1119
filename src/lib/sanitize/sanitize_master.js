import {
  sanitize_prevent_circular,
  sanitize_restore_circular,
} from "#lib/sanitize/circular_references.js";
import { limit_depth_and_lenght } from "#lib/sanitize/limit_depth_and_lenght.js";
import { from_short, short } from "#lib/sanitize/optimize_keys.js";
import { entries_recursive_map } from "#lib/sanitize/recursive_map2.js";

export function sanitizer_master_sanitize(
  object,
  transfrormer = null,
  { table, max_depth, max_length, circular_prevent = true, filter } = {},
) {
  circular_prevent && (object = sanitize_prevent_circular(object));
  (max_depth || max_length) &&
    (object = limit_depth_and_lenght(object, max_depth, max_length, filter));
  table && (object = short(object, table));
  transfrormer && (object = entries_recursive_map(object, transfrormer));
  return object;
}

export function sanitizer_master_desanitize(
  object,
  transfrormer = null,
  { table, circular_prevented = true } = {},
) {
  transfrormer && (object = entries_recursive_map(object, transfrormer));
  table && (object = from_short(object, table));
  circular_prevented && (object = sanitize_restore_circular(object));
  return object;
}
