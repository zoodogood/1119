import { BaseInteraction, User } from "discord.js";

BaseInteraction.prototype.toSafeValues = function () {
  return {
    ...this.user.toSafeValues(),
  };
};

User.prototype.toSafeValues = function () {
  return { ...this };
};
