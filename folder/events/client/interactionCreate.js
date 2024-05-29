import { client } from "#bot/client.js";
import { actionRowsToComponents } from "#lib/Discord_utils.js";
import { BaseEvent } from "#lib/modules/EventsManager.js";
import { CommandsManager, Executor } from "#lib/modules/mod.js";
import { sleep } from "#lib/safe-utils.js";
import { ButtonStyle } from "discord.js";

class Event extends BaseEvent {
  options = {
    name: "client/interactionCreate",
  };

  constructor() {
    const EVENT = "interactionCreate";
    super(client, EVENT);
  }

  async cleanUnhandled(interaction) {
    if (!interaction.isButton()) {
      return;
    }

    await sleep(1000);
    if (interaction.replied || interaction.deffered) {
      return;
    }

    const current_components = actionRowsToComponents(
      interaction.message.components,
    );
    const component = current_components
      .flat()
      .find((component) => component.customId === interaction.customId);

    component.style = ButtonStyle.Danger;
    interaction.message.msg({
      edit: true,
      components: current_components,
    });
  }

  async run(interaction) {
    const customId = interaction.customId;

    if (interaction.isCommand()) {
      const { commandName } = interaction;
      const command = CommandsManager.callMap.get(commandName);
      CommandsManager.execute(command, interaction);
      return;
    }
    if (customId.startsWith("@")) {
      const [type, target, params] = Executor.parseCustomId(customId) ?? [];
      type && Executor.emit(type, target, { params, interaction });
      return;
    }

    this.cleanUnhandled(interaction);
  }
}

export default Event;
