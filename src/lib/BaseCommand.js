import { BaseContext } from "#lib/BaseContext.js";
import { DataManager } from "#lib/DataManager/singletone.js";
import { takeInteractionProperties } from "#lib/Discord_utils.js";
import CooldownManager from "#lib/modules/CooldownManager.js";
import { ErrorsHandler } from "#lib/modules/ErrorsHandler.js";
import { sendErrorInfo } from "#lib/sendErrorInfo.js";

// @ts-check

const statistics_api = {
  increase: ({ interaction: { guild }, command }) => {
    const commandOptions = command.options;

    const botData = DataManager.data.bot;
    const guildData = guild?.data;

    if (guildData) {
      guildData.commandsUsed ||= {};
      guildData.commandsUsed[commandOptions.id] ||= 0;
      guildData.commandsUsed[commandOptions.id]++;
    }

    if (botData) {
      botData.commandsUsed[commandOptions.id] ||= 0;
      botData.commandsUsed[commandOptions.id]++;

      botData.commandsUsedToday ||= 0;
      botData.commandsUsedToday++;
    }
  },

  getUsesCount: (id, guildData) => {
    if (guildData) {
      guildData.commandsUsed ||= {};
      return guildData.commandsUsed[id] || 0;
    }

    const botData = DataManager.data.bot;
    return botData.commandsUsed[id] || 0;
  },
};

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

  _cooldown_api(context) {
    const { interaction } = context;
    const { options } = this;
    const { userData } = interaction;
    return CooldownManager.api(userData, `CD_${options.id}`, {
      heat: options.cooldownTry ?? 1,
      perCall: options.cooldown,
    });
  }
  async _error_strategy(error, context, execution_context) {
    const execution_context_safe = execution_context?.toSafeValues() || null;
    const { command, interaction, typeBase } = context;
    ErrorsHandler.onErrorReceive(error, {
      userId: interaction.user.id,
      type: typeBase.type,
      command: command.options.name,
      source: "Command",
      ...execution_context_safe,
    });
    sendErrorInfo({
      channel: interaction.channel,
      error,
      interaction,
      primary: execution_context_safe,
    });
  }

  _statistic_increase(context) {
    statistics_api.increase(context);
  }
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
