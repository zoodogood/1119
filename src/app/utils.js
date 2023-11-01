import { OAuth2Scopes, PermissionFlagsBits } from "discord.js";
import Path from "path";
const root = process.cwd();

async function ReadPackageJson() {
  const { default: FileSystem } = await import("fs/promises");
  const value = await FileSystem.readFile(`${process.cwd()}/package.json`);

  return JSON.parse(value);
}

function takePath(...relativePath) {
  return Path.resolve(root, ...relativePath);
}

function generateInviteFor(client) {
  const scopes = [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands];
  const permissions = [
    PermissionFlagsBits.Administrator,
    PermissionFlagsBits.ManageEmojisAndStickers,
  ];
  return client.generateInvite({ scopes, permissions });
}

export { takePath, ReadPackageJson, generateInviteFor };
