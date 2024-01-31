export const KEYS_TO_UPGRADE_CHEST_TO_LEVEL_2 = 150;
export const KEYS_TO_UPGRADE_CHEST_TO_LEVEL_3 = 2000;

export const CALCULATE_CLOVER_MULTIPLAYER = (clovers) => {
  const CLOVER_MIN_EFFECT = 0.08;
  const INCREASE_BY_CLOVER = 0.07;
  const WEAKING_FOR_CLOVER = 0.9242;
  const reduce = 1 - WEAKING_FOR_CLOVER ** clovers;
  const value =
    CLOVER_MIN_EFFECT +
    (INCREASE_BY_CLOVER * reduce) / (1 - WEAKING_FOR_CLOVER);
  return value;
};
