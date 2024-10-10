import { BaseContext } from "#lib/BaseContext.js";
import { takeInteractionProperties } from "#lib/Discord_utils.js";

// @ts-check

class BaseCommand {
  componentsCallbacks = {};

  /**
   *@type {{
   *  name: string
   *  media: {description: string, example?: string, poster?: string}
   *  type: string
   *  alias: string
   *  allowDM?: boolean
   *  expectMention?: boolean
   *  expectParams?: boolean
   *  cooldown?: number
   *  cooldownTry?: number
   *  myChannelPermissions?: bigint
   *  myPermissions?: bigint
   *  userChannelPermissions?: bigint
   *  userPermissions?: bigint
   *  cliParser?: {flags: []}
   *  accessibility?: {
   *    publicized_on_level?: number
   *  }
   *  hidden?: boolean
   *  removed?: boolean
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
    const callback = this.componentsCallbacks[target];
    if (!callback) {
      throw new Error(`Unknown component: ${rawParams}`);
    }
    callback.call(this, context);
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
