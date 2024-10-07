import { BaseContext } from "#lib/BaseContext.js";
import { takeInteractionProperties } from "#lib/Discord_utils.js";

// @ts-check

class BaseCommand {
  componentsCallbacks = {};

  /**
   *@type {{
   *  name: string
   *  media: {description: string, example?: string, poster?: string}
   *  alias: string
   *  allowDM?: boolean
   *  cooldown?: number
   *  cooldownTry?: number
   *  cliParser: {flags: []}
   *  accessibility?: {
   *    publicized_on_level?: number
   *  }
   *  hidden?: boolean
   *}}
   */
  options = {};

  /**
   *
   * @param {import("discord.js").Message} message
   * @param {ReturnType<import("#lib/modules/CommandsManager.js").parseInputCommandFromMessage>} interaction
   * @abstract
   */
  onChatInput(_message, _interaction) {}

  onComponent({ params: rawParams, interaction }) {
    const [target, ...params] = rawParams.split(":");
    const context = new BaseContext(
      `@oncomponent/${this.options.name}/${params}`,
      {
        interaction,
        primary: interaction,
        ...takeInteractionProperties(interaction),
        params,
      },
    );
    this.componentsCallbacks[target].call(this, context);
  }

  /**
   * @abstract
   */
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
