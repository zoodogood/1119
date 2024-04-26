import { BaseCommand } from "#lib/BaseCommand.js";
import { MongoDBDriver } from "#lib/MongoDBDriver.js";
import { MessagePayload } from "discord.js";

class Command extends BaseCommand {
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
    accessibility: {
      publicized_on_level: 10,
    },
    alias: "локализация локалізація i18n",
    allowDM: true,
    cooldown: 4_000,
    hidden: true,
    type: "other",
  };
}

export default Command;
