import { PermissionFlagsBits } from "discord.js";

const CombinedPermissionFlags = {
  SafeAll: PermissionFlagsBits.AddReactions,
  ...PermissionFlagsBits,
};

export { CombinedPermissionFlags };
