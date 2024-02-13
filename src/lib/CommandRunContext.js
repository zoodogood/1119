// @ts-check
import EventsManager from "#lib/modules/EventsManager.js";

class BaseCommandRunContext {
  command = null;
  interaction = null;
  emitter = new EventsManager();

  setCliParsed(parsed, values) {
    this.cliParsed = [parsed, values];
  }
  getCliParsed() {
    return this.cliParsed || [null, null];
  }
  cliParsed = null;

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
  }
}

export { BaseCommandRunContext };
