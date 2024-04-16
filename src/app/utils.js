import { ActionsMap } from "#constants/enums/actionsMap.js";
import { OAuth2Scopes, PermissionFlagsBits } from "discord.js";
import Path from "path";
const root = process.cwd();

export async function ReadPackageJson() {
  const { default: FileSystem } = await import("fs/promises");
  const value = await FileSystem.readFile(`${process.cwd()}/package.json`);

  return JSON.parse(value);
}

export function takePath(...relativePath) {
  return Path.resolve(root, ...relativePath);
}

export function generateInviteFor(client) {
  const scopes = [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands];
  const permissions = [
    PermissionFlagsBits.Administrator,
    PermissionFlagsBits.ManageGuildExpressions,
  ];
  return client.generateInvite({ scopes, permissions });
}

export function addResource({
  resource,
  user,
  value,
  source,
  context,
  executor,
}) {
  if (Number.isNaN(value)) {
    throw new Error(`Add NaN resource count`, {
      details: { source, resource },
    });
  }

  user.action(ActionsMap.resourceChange, {
    value,
    executor,
    source,
    resource,
    context,
  });
  user.data[resource] ||= 0;
  user.data[resource] += value;
}

export function addMultipleResources({
  resources,
  user,
  source,
  context,
  executor,
}) {
  const addResourceOptions = { user, source, context, executor };
  for (const [resource, value] of Object.entries(resources)) {
    addResource({
      ...addResourceOptions,
      resource,
      value,
    });
  }
}
