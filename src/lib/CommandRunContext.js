// @ts-check
import EventsManager from "#lib/modules/EventsManager.js";

class BaseCommandRunContext {
  emitter = new EventsManager();

  end() {
    this.isEnded = true;
  }

  static new(interaction, command) {}
  constructor(interaction, command) {
    this.interaction = interaction;
    this.command = command;
  }
}

export { BaseCommandRunContext };
