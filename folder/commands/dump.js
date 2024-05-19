import { BaseCommand } from "#lib/BaseCommand.js";
import DataManager from "#lib/modules/DataManager.js";

class Command extends BaseCommand {
  async onChatInput(msg, interaction) {
    DataManager.file.write();
    const message = await msg.channel.send({
      files: [
        {
          attachment: "data/main.json",
          name: new Intl.DateTimeFormat("ru-ru", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          }).format(),
        },
      ],
    });

    setTimeout(() => message.delete(), 1_000_000);
  }

  options = {
    name: "dump",
    id: 60,
    media: {
      description: "",
    },
    alias: "дамп",
    allowDM: true,
    cooldown: 100_000,
    type: "dev",
  };
}

export default Command;
