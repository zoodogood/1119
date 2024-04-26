import { pushMessage } from "#lib/DiscordPushMessage.js";
import { AttachmentBuilder } from "discord.js";

export class ReactionInteraction {
  constructor(reaction, user) {
    const { message, emoji } = reaction;
    const { channel, guild } = message;
    const customId = emoji.code;
    Object.assign(this, {
      user,
      message,
      channel,
      guild,
      reaction,
      emoji,
      customId,
    });
  }
  msg(...options) {
    return pushMessage.call(this.channel, ...options);
  }
}

export function jsonFile(data, name) {
  const buffer = Buffer.from(JSON.stringify(data, null, "\t"));
  return new AttachmentBuilder(buffer, {
    name,
  });
}
