// @ts-check
import EventsManager from "#lib/modules/EventsManager.js";

class BaseCommandRunContext {
  command = null;
  interaction = null;
  guild = null;
  channel = null;
  user = null;
  emitter = new EventsManager();
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
    this.interaction = interaction;
    this.command = command;
    this.guild = interaction.guild;
    this.channel = interaction.channel;
    this.user = interaction.user;
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
