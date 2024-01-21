// @ts-check
class BaseCommand {
  /**
   *
   * @param {import("discord.js").Message} message
   * @param {ReturnType<import("#lib/modules/CommandsManager.js").parseInputCommandFromMessage>} interaction
   */
  onChatInput(message, interaction) {}
}

export { BaseCommand };
