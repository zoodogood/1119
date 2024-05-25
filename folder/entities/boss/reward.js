import { addMultipleResources } from "#lib/util.js";

export class RewardSystem {
  static BossEndPull = {
    DEFAULT_VOID: 1,
    VOID_REWARD_DENOMINATOR: 0.5,
    VOID_LIMIT_MULTIPLAYER: 0.5,
    DAMAGE_FOR_VOID: 5_000,
    DAMAGE_FOR_KEY: 50_000,
    KEYS_LIMIT: 15_000,
    calculateVoid({ userStats, level }) {
      const byDamage =
        (userStats.damageDealt / this.DAMAGE_FOR_VOID) **
        this.VOID_REWARD_DENOMINATOR;

      const limit = level * this.VOID_LIMIT_MULTIPLAYER;
      const value = byDamage + this.DEFAULT_VOID;
      return Math.floor(Math.min(limit, value));
    },
    calculateKeys(userStats) {
      const value = Math.floor(userStats.damageDealt / this.DAMAGE_FOR_KEY);
      return Math.min(this.KEYS_LIMIT, value);
    },
    resources({ userStats, level }) {
      return {
        void: this.calculateVoid({ userStats, level }),
        keys: this.calculateKeys(userStats),
      };
    },
  };
  static Chest = {
    BASE_BONUSES: 50,
    BONUSES_PER_LEVEL: 10,
    DAMAGE_FOR_KEY: 5_000,
    KEYS_LIMIT: 2_000,
    calculateChestBonus(level) {
      return this.BASE_BONUSES + level * this.BONUSES_PER_LEVEL;
    },
    calculateKeys(userStats) {
      const value = Math.floor(
        (userStats.damageDealt || 0) / this.DAMAGE_FOR_KEY,
      );
      return Math.min(this.KEYS_LIMIT, value);
    },
    resources({ userStats, level }) {
      return {
        chestBonus: this.calculateChestBonus(level),
        keys: this.calculateKeys(userStats),
      };
    },
  };
  static GuildHarvest = {
    REWARD_PER_LEVEL: 1_000,
    onBossEnded(guild, boss) {
      const value = boss.level * this.REWARD_PER_LEVEL;
      RewardSystem.putCoinsToBank(guild, value);
    },
  };
  static LevelKill = {
    BASE: 80,
    ADDING_PER_LEVEL: 5,
    calculateKillExpReward({ toLevel, fromLevel }) {
      const { BASE, ADDING_PER_LEVEL } = this;
      const perLevel =
        BASE + (toLevel + fromLevel + 1) * (ADDING_PER_LEVEL / 2);
      return perLevel * (toLevel - fromLevel);
    },
    resources({ fromLevel, toLevel }) {
      return {
        exp: this.calculateKillExpReward({ fromLevel, toLevel }),
      };
    },
  };
  static MostStrongUser = {
    VOID_REWARD: 3,
    calculateVoid() {
      return this.VOID_REWARD;
    },
    resources() {
      return {
        void: this.calculateVoid(),
      };
    },
  };
  static putCoinsToBank(guild, value) {
    guild.data.coins ||= 0;
    guild.data.coins += value;
  }
  /**
   *
   * @param {Parameters<typeof addResource>[0]} addResourceOptions
   * @param {Record<string, number>} rewardPull
   */
  static sendReward(addResourceOptions, rewardPull) {
    return addMultipleResources({
      ...addResourceOptions,
      resources: rewardPull,
    });
  }
}
