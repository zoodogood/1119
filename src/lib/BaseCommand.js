// @ts-check
class BaseCommand {
  componentsCallbacks = {};

  /**
   *
   * @param {import("discord.js").Message} message
   * @param {ReturnType<import("#lib/modules/CommandsManager.js").parseInputCommandFromMessage>} interaction
   */
  onChatInput(message, interaction) {}

  onComponent({ params: rawParams, interaction }) {
    const [target, ...params] = rawParams.split(":");
    this.componentsCallbacks[target].call(this, interaction, ...params);
  }

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
