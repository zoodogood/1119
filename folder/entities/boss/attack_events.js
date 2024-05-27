import BossManager from "#lib/modules/BossManager.js";

export function resolve_attack_events_pull(context) {
  return [...BossManager.eventBases.values()]
    .filter((base) => !base.filter || base.filter(context))
    .map((event) => ({
      ...event,
      _weight:
        typeof event.weight === "function"
          ? event.weight(context)
          : event.weight,
    }));
}
