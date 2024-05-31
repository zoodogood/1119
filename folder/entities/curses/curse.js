import CurseManager from "#lib/modules/CurseManager.js";

export function resolve_description({ curse, user, curseBase }) {
  curseBase ||= CurseManager.cursesBase.get(curse.id);
  const { description } = curseBase;
  return typeof description === "function"
    ? description.call(curseBase, user, curse)
    : description;
}
