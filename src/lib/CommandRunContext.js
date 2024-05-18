// @ts-check
import { BaseContext } from "#lib/BaseContext.js";

class BaseCommandRunContext extends BaseContext {
  options = {};
  command = null;
  interaction = null;
  whenRunExecuted = null;

  setCliParsed(parsed, values) {
    this.cliParsed = [parsed, values];
    return this;
  }
  getCliParsed() {
    return this.cliParsed || [null, null];
  }
  cliParsed = null;

  setWhenRunExecuted(whenRunExecuted) {
    this.whenRunExecuted = whenRunExecuted;
    return this;
  }

  end() {
    this.isEnded = true;
  }
  isEnded = false;

  static async new(interaction, command) {
    return new this(interaction, command);
  }
  constructor(interaction, command) {
    super(`command.${command.options.name}`, interaction);
    this.command = command;
    this.interaction = interaction;
    interaction.extend && Object.assign(this.options, interaction.extend);
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
