import $ from "mol_tree2";
export { $ as mol_global };

export function mol_tree2_json_from_string(string, uri) {
  return $.$mol_tree2_to_json(
    $.$mol_tree2_from_string(String(string), uri).kids[0],
  );
}

export function mol_tree2_string_from_json(json, span) {
  return $.$mol_tree2_from_json(json, span).toString();
}
