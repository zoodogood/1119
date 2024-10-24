import { BaseChannel, BaseInteraction, Guild, User } from "discord.js";

BaseInteraction.prototype.toSafeValues = function () {
  return {
    user: this.user.toSafeValues(),
  };
};

User.prototype.toSafeValues = function () {
  const { id, username } = this;
  return { id, username };
};

Guild.prototype.toSafeValues = function () {
  const { id, name } = this;
  return { id, name };
};

BaseChannel.prototype.toSafeValues = function () {
  const { id, name } = this;
  return { id, name };
};
