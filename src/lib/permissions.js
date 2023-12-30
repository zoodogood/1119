import app from "#app";
import { PermissionFlags } from "#constants/enums/discord/permissions.js";
import { PermissionFlagsBits, PermissionsBitField } from "discord.js";

export function permissionsBitsToI18nArray(permissionBits, locale) {
  return new PermissionsBitField(permissionBits)
    .toArray()
    .map((string) => permissionRawToI18n(string, locale));
}

/**
 * @param {import("discord.js").PermissionsString[]} permissionsStrings
 */
export function permissionRawToI18n(permissionsString, locale) {
  const bits = PermissionFlagsBits[permissionsString];
  const string = PermissionFlags[bits];
  return app.i18n.format(string, { locale });
}
