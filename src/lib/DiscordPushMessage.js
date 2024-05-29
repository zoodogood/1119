import config from "#config";
import { sendErrorInfo } from "#lib/sendErrorInfo.js";
import { justSendMessage } from "@zoodogood/utils/discordjs";
import { InteractionResponse, Message } from "discord.js";

export async function pushMessage(options) {
  options.color ||= config.development ? "#000100" : "#23ee23";

  const target =
    this instanceof InteractionResponse
      ? this.interaction
      : this instanceof Message && !options.edit
        ? this.channel
        : this;

  const message = (async () => {
    try {
      return await justSendMessage(target, options);
    } catch (error) {
      if (!error.message.includes("Invalid Form Body")) {
        console.error(target, options);
        console.error(error);
        throw error;
      }
      await sendErrorInfo({
        description: "Оригинальное сообщение не было доставлено",
        channel: target,
        error,
      });
      throw new Error(error.message, { cause: error });
    }
  })();

  return message;
}
