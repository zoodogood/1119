// @ts-check
class BaseCommandRunContext {
  static new(interaction, command) {}

  constructor(interaction, command) {
    this.interaction = interaction;
    this.command = command;
  }
}

export { BaseCommandRunContext };
