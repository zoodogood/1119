import BossManager from "#lib/modules/BossManager.js";

export function damageTypeLabel(value) {
  const numeric =
    typeof value === "string" ? BossManager.DAMAGE_SOURCES[value] : value;
  return BossManager.DAMAGE_SOURCES[numeric].label;
}
