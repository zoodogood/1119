import BossManager from "#lib/modules/BossManager.js";

export function current_health(boss) {
  const thresholder = current_health_thresholder(boss);
  return thresholder - boss.damageTaken;
}

export function current_health_thresholder(boss) {
  return boss.healthThresholder || update_health_thresholder(boss);
}

export function update_health_thresholder(boss) {
  boss.healthThresholder = BossManager.calculateHealthPointThresholder(
    boss.level,
  );
  return boss.healthThresholder;
}
