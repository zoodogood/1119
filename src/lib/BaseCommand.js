// @ts-check
class BaseCommand {
  /**
   *
   * @param {import("discord.js").Message} message
   * @param {ReturnType<import("#lib/modules/CommandsManager.js").parseInputCommandFromMessage>} interaction
   */
  onChatInput(message, interaction) {}

  onComponent() {}

  onSlash() {}
}

class BaseFlagSubcommand {
  /**
   *
   * @param {import("#lib/CommandRunContext").BaseCommandRunContext} context
   * @param {import("@zoodogood/utils/CliParser").CapturedContent} value
   */
  constructor(context, value) {
    this.capture = value;
    this.context = context;
  }
  onProcess() {}
}

export { BaseCommand, BaseFlagSubcommand };
