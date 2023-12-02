import { BaseEvent } from "#lib/modules/EventsManager.js";
import { CommandsManager, Executor } from "#lib/modules/mod.js";
import { client } from "#bot/client.js";

class Event extends BaseEvent {
  constructor() {
    const EVENT = "interactionCreate";
    super(client, EVENT);
  }

  async run(interaction) {
    const customId = interaction.customId;

    if (interaction.isCommand()) {
      const name = interaction.name;
      const command = CommandsManager.callMap.get(name);
      CommandsManager.execute(command, interaction);
      return;
    }
    if (customId.startsWith("@")) {
      const [type, target, params] = Executor.parseCustomId(customId) ?? [];
      type && Executor.emit(type, target, { params, interaction });
      return;
    }
  }

  options = {
    name: "client/interactionCreate",
  };
}

export default Event;
