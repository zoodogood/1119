// @ts-check
import { BaseContext } from "#lib/BaseContext.js";
import { takeInteractionProperties } from "#lib/Discord_utils.js";

class BaseCommandRunContext extends BaseContext {
  cliParsed = null;
  /** @type {import("#lib/BaseCommand.js").BaseCommand} */
  command = null;
  /** @type {import("#lib/modules/CommandsManager.js").CommandInteraction} */
  interaction = null;
  isEnded = false;

  options = {};
  whenRunExecuted = null;
  constructor(interaction, command) {
    super(`command.${command.options.name}`, {
      interaction,
      primary: interaction,
      ...takeInteractionProperties(interaction),
    });
    this.command = command;
    this.interaction = interaction;
    interaction.extend && Object.assign(this.options, interaction.extend);
  }

  static async new(interaction, command) {
    return new this(interaction, command);
  }

  end() {
    this.isEnded = true;
  }
  getCliParsed() {
    return this.cliParsed || [null, null];
  }

  setCliParsed(parsed, values) {
    this.cliParsed = [parsed, values];
    return this;
  }
  setWhenRunExecuted(whenRunExecuted) {
    this.whenRunExecuted = whenRunExecuted;
    return this;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      command: this.command.options.name,
    };
  }
}

export { BaseCommandRunContext };
