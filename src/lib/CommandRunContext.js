// @ts-check
import { BaseContext } from "#lib/BaseContext.js";

class BaseCommandRunContext extends BaseContext {
  cliParsed = null;
  command = null;
  interaction = null;
  isEnded = false;

  options = {};
  whenRunExecuted = null;
  constructor(interaction, command) {
    super(`command.${command.options.name}`, interaction);
    this.command = command;
    this.interaction = interaction;
    interaction.extend && Object.assign(this.options, interaction.extend);
  }

  end() {
    this.isEnded = true;
  }

  getCliParsed() {
    return this.cliParsed || [null, null];
  }
  static async new(interaction, command) {
    return new this(interaction, command);
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
      type: "commandContext",
      command: this.command.options.name,
      comment: "experiment",
    };
  }
}

export { BaseCommandRunContext };
