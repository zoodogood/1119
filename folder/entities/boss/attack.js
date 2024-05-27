import { ActionsMap } from "#constants/enums/actionsMap.js";
import { BaseContext } from "#lib/BaseContext.js";
import { takeInteractionProperties } from "#lib/Discord_utils.js";
import { createDefaultPreventable } from "#lib/createDefaultPreventable.js";
import BossManager, { BossEvents } from "#lib/modules/BossManager.js";
import { NumberFormatLetterize, random } from "#lib/safe-utils.js";

/**
 *
 * @param {import("discord.js").User} user
 * @param {object} boss
 * @param {string} source
 * @param {object} primary
 * @param {CallableFunction | number} update_fixed
 * @param {CallableFunction | number} update_current
 * @returns {number}
 */
export function update_attack_cooldown(
  user,
  boss,
  source,
  primary,
  update_fixed,
  update_current = null,
) {
  const userStats = BossManager.getUserStats(boss, user.id);
  const fixed_previous =
    userStats.attackCooldown || BossManager.USER_DEFAULT_ATTACK_COOLDOWN;

  const fixed =
    typeof update_fixed === "number"
      ? fixed_previous + update_fixed
      : update_fixed(fixed_previous);

  update_current === null &&
    (update_current = (previous) => previous - (fixed_previous - fixed));
  const current_previous = userStats.attack_CD || Date.now();
  const current =
    typeof update_current === "number"
      ? current_previous + update_current
      : update_current(current_previous);

  if (isNaN(fixed) || isNaN(current)) {
    throw new TypeError(
      `Expected number, get: ${update_fixed}, ${update_current}`,
    );
  }

  const context = new BaseContext(source, {
    current,
    fixed,
    primary,
    ...takeInteractionProperties(primary),
    source,
    update_current,
    update_fixed,
    ...createDefaultPreventable(),
  });
  user.action(ActionsMap.bossBeforeAttackCooldownUpdated, context);
  if (context.defaultPrevented()) {
    return;
  }

  userStats.attackCooldown = fixed;
  userStats.attack_CD = current;
  return fixed_previous - fixed;
}

export function update_attack_damage_multiplayer(
  user,
  boss,
  source,
  primary,
  callback,
) {
  const userStats = BossManager.getUserStats(boss, user.id);
  const previous = userStats.attacksDamageMultiplayer ?? 1;
  const value = +callback(previous).toFixed(3);
  const context = new BaseContext(source, {
    previous,
    value,
    primary,
    ...takeInteractionProperties(primary),
    source,
    ...createDefaultPreventable(),
  });

  user.action(ActionsMap.bossBeforeAttackDamageMultiplayerUpdated, context);

  if (context.defaultPrevented()) {
    return;
  }

  userStats.attacksDamageMultiplayer = value;
}

export function core_make_attack_context(boss, user, channel, primary = {}) {
  const userStats = BossManager.getUserStats(boss, user.id);

  const attackContext = {
    baseDamage: BossManager.USER_DEFAULT_ATTACK_DAMAGE,
    damageMultiplayer: 1,
    eventsCount: Math.floor(boss.level ** 0.5) + random(-1, 1),
    listOfEvents: [],
    message: null,
  };

  const context = new BaseContext("", {
    primary,
    attackContext,
    boss,
    channel,
    fetchMessage() {
      return this.message;
    },
    guild: channel.guild,
    message: null,
    user,
    userStats,
    afterAttack: {},
    ...createDefaultPreventable(),
  });
  return context;
}

export async function core_make_attack(context) {
  const { user, boss } = context;
  const { attackContext, userStats } = context;
  const damage = Math.ceil(
    (userStats.attacksDamageMultiplayer ?? 1) *
      attackContext.baseDamage *
      attackContext.damageMultiplayer,
  );
  attackContext.damageDealt = damage;

  const damageSourceType = BossManager.DAMAGE_SOURCES.attack;
  context.afterAttack.dealt = BossManager.makeDamage(boss, damage, {
    damageSourceType,
    sourceUser: user,
  });

  user.action(ActionsMap.bossAfterAttack, context);
  BossEvents.afterAttacked(boss, context);

  boss.stats.userAttacksCount++;
  userStats.attacksCount = (userStats.attacksCount || 0) + 1;
  return context;
}

export function display_attack(context) {
  const { attackContext, afterAttack, channel, user } = context;
  const { dealt } = afterAttack;
  const eventsContent = attackContext.listOfEvents
    .map((event) => `・ ${event.description}.`)
    .join("\n");

  const description = `Нанесено урона с прямой атаки: ${NumberFormatLetterize(
    dealt,
  )} ед.\n\n${eventsContent}`;

  const emoji = "⚔️";
  const embed = {
    title: `${emoji} За сервер ${channel.guild.name}!`,
    description,
    footer: { iconURL: user.avatarURL(), text: user.tag },
  };
  return channel.msg(embed);
}

export function process_before_attack(context) {
  const { user, boss } = context;
  user.action(ActionsMap.bossBeforeAttack, context);
  BossEvents.beforeAttacked(boss, context);
  if (context.defaultPrevented()) {
    return false;
  }
  return true;
}
