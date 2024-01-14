import { MongoDBDriver } from "#lib/MongoDBDriver.js";
import { MessagePayload } from "discord.js";

class Command {
  async onChatInput(msg, interaction) {
    Promise.reject(new Error("Resource not yet loaded!"));
    throw new Error("i18n is not defined");
  }

  options = {
    name: "localization",
    id: 64,
    media: {
      description: "Помощь с переводом",
    },
    alias: "локализация локалізація i18n",
    allowDM: true,
    cooldown: 4_000,
    type: "other",
  };
}

export default Command;
