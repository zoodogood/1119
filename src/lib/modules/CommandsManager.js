// @ts-check
import config from "#config";
import {
  Collection,
  CommandInteraction as DiscordCommandInteraction,
} from "discord.js";

import Executor from "#lib/modules/Executor.js";
import EventsEmitter from "events";

import { Actions } from "#lib/modules/ActionManager.js";

import app from "#app";
import { take_missing_permissions } from "#bot/util.js";
import { CustomCommand } from "#folder/commands/guildcommand.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { permissionRawToI18n } from "#lib/permissions.js";
import { ImportDirectory } from "@zoodogood/import-directory";

const COMMANDS_PATH = "./folder/commands";

export const Events = {
  signal_command_flow_end: "signal_command_flow_end",
};

export function resolve_command(command_name, source_guild) {
  return (
    CommandsManager.callMap.get(command_name) ||
    (() => {
      const custom_command = source_guild?.data.custom_commands?.[command_name];
      if (!custom_command) {
        return false;
      }
      return new CustomCommand(custom_command, source_guild);
    })()
  );
}

export class CommandInteraction {
  constructor({ params, user, channel, guild, commandBase, message, client }) {
    /** @type {string | string[]} */
    this.params = params;
    /** @type {import("discord.js").User} */
    this.user = user;
    /** @type {import("discord.js").Channel} */
    this.channel = channel;
    /** @type {import("discord.js").Guild} */
    this.guild = guild;
    /** @type {string} */
    this.commandBase = commandBase;
    /** @type {import("discord.js").Message} */
    this.message = message;
    /** @type {import("discord.js").Client} */
    this.client = client || app.client;

    /** @type {import("#lib/BaseCommand.js").BaseCommand} */
    this.command = resolve_command(commandBase, guild);

    /** @type {import("discord.js").GuildMember} */
    this.member = guild?.members.resolve(user) || null;
    /** @type {import("#constants/Schema.js").users} */
    this.userData = user.data;
    /** @type {import("discord.js").User} */
    this.mention = message.mentions?.users.first() ?? null;
  }

  msg(...params) {
    // @ts-expect-error
    return this.channel.msg(...params);
  }

  toSafeValues() {
    // @ts-expect-error
    return { user: this.user.toSafeValues() };
  }
}
/**
 * @returns {CommandInteraction}
 */
function parseInputCommandFromMessage(message) {
  const content = message.content.trim();
  const PREFIX = "!";

  if (!content.startsWith(PREFIX)) {
    return null;
  }

  const words = content.split(" ").filter(Boolean);
  const spliceCommandBase = (words) => {
    const DEFAULT_BASE_LENGTH = 1;
    const prefixIsAlone = words.at(0) === PREFIX;

    const length = DEFAULT_BASE_LENGTH + Number(prefixIsAlone);

    const base = words.splice(0, length).join("");
    return base.slice(PREFIX.length).toLowerCase();
  };
  const commandBase = spliceCommandBase(words);
  const params = words.join(" ");

  const { client, author: user, channel, guild } = message;

  const commandContext = new CommandInteraction({
    commandBase,
    client,
    params,
    message,
    user,
    channel,
    guild,
  });

  commandContext.user.action(Actions.inputCommandParsed, commandContext);

  if (!commandContext.command) {
    return null;
  }
  return commandContext;
}

class CommandsManager {
  static collection = null;

  static CommandInteraction = CommandInteraction;
  static emitter = new EventsEmitter();

  static EXECUTION_TYPES = {
    slash: {
      type: "slash",
      call: async (command, interaction) => {
        return await command.onSlashCommand(interaction);
      },
      condition: (interaction) =>
        interaction instanceof DiscordCommandInteraction,
    },
    input: {
      type: "input",
      call: async (command, interaction) => {
        command.options.removeCallMessage ? interaction.message.delete() : null;
        const output = await command.onChatInput(
          interaction.message,
          interaction,
        );
        return output;
      },
      condition: (interaction) => "message" in interaction,
    },
  };

  static parseInputCommandFromMessage = parseInputCommandFromMessage;

  /**
   *
   * @param {import("#lib/BaseCommand").BaseCommand} command
   * @param {CommandInteraction} interaction
   */
  static checkAvailable(command, interaction) {
    const problems = [];
    const options = command.options;

    if (options.removed && interaction.user.id !== "921403577539387454") {
      problems.push("Эта команда была удалена и не может быть использована");
    }

    if (
      options.type === "dev" &&
      !config.developers.includes(interaction.user.id)
    ) {
      problems.push(
        "Эта команда находится в разработке и/или недоступна в публичной версии бота",
      );
    }

    if (!options.allowDM && interaction.channel.isDMBased()) {
      problems.push("Эта команда может быть вызвана только на сервере");
    }

    if (options.expectMention && !interaction.mention) {
      problems.push("Вы не упомянули пользователя");
    }
    if (options.expectParams && !interaction.params) {
      problems.push("Вы не указали аргументов");
    }

    const clientWastedChannelPermissions =
      !interaction.channel.isDMBased() &&
      options.myChannelPermissions &&
      take_missing_permissions(
        interaction.guild.members.me,
        options.myChannelPermissions,
        interaction.channel,
      ).length;

    if (clientWastedChannelPermissions) {
      const { locale } = interaction.user.data;
      const permissions = clientWastedChannelPermissions.map((string) =>
        permissionRawToI18n(string, locale),
      );
      const content = Util.joinWithAndSeparator(permissions);
      problems.push(
        `Боту необходимы следующие права в этом канале: ${content}`,
      );
    }

    const clientWastedGuildPermissions =
      !interaction.channel.isDMBased() &&
      options.myPermissions &&
      take_missing_permissions(
        interaction.guild.members.me,
        options.myPermissions,
      ).length;
    if (clientWastedGuildPermissions) {
      const { locale } = interaction.user.data;
      const permissions = clientWastedGuildPermissions.map((string) =>
        permissionRawToI18n(string, locale),
      );
      const content = Util.joinWithAndSeparator(permissions);
      problems.push(
        `Боту необходимы следующие права в этой гильдии: ${content} `,
      );
    }

    const userWastedChannelPermissions =
      !interaction.channel.isDMBased() &&
      options.userChannelPermissions &&
      take_missing_permissions(
        interaction.member,
        options.userChannelPermissions,
        interaction.channel,
      ).length;
    if (userWastedChannelPermissions) {
      const { locale } = interaction.user.data;
      const permissions = userWastedChannelPermissions.map((string) =>
        permissionRawToI18n(string, locale),
      );
      const content = Util.joinWithAndSeparator(permissions);
      problems.push(
        `Вам необходимо обладать следующими правами внутри текущего канала: ${content} `,
      );
    }

    const userWastedGuildPermissions =
      !interaction.channel.isDMBased() &&
      options.userPermissions &&
      take_missing_permissions(interaction.member, options.userPermissions)
        .length;
    if (userWastedGuildPermissions) {
      const { locale } = interaction.user.data;
      const permissions = userWastedGuildPermissions.map((string) =>
        permissionRawToI18n(string, locale),
      );
      const content = Util.joinWithAndSeparator(permissions);
      problems.push(
        `Вам необходимо обладать следующими правами внутри гильдии: ${content} `,
      );
    }

    (() => {
      if (!options.cooldown) {
        return;
      }

      const cooldownApi = command._cooldown_api({ interaction });

      const cooldownFullEndAt = cooldownApi.getCurrentCooldownEnd();
      if (!cooldownFullEndAt) {
        return;
      }
      if (!cooldownApi.checkYet()) {
        return;
      }

      const difference = cooldownApi.diff() + 500;
      problems.push(`Перезарядка: **${Util.timestampToDate(difference)}**`);
    })();

    if (problems.length === 0) {
      return true;
    }

    const helpMessage = async () => {
      const embed = {
        author: {
          iconURL: interaction.user.avatarURL(),
          name: interaction.user.username,
        },
        color: "#ff0000",
        delete: 20000,
      };
      if (problems.length === 1) {
        embed.title = problems.at(0);
      }
      if (problems.length > 1) {
        embed.title = "Упс, образовалось немного проблемок:";
        embed.description = problems
          .map((problem) => `• ${problem}`)
          .join("\n");
      }
      const message = await interaction.message.msg(embed);

      const isHelpedNeeds =
        problems.includes("Вы не указали аргументов") ||
        problems.includes("Вы не упомянули пользователя");
      if (!isHelpedNeeds) {
        return;
      }

      const react = await message.awaitReact(
        { user: interaction.user, removeType: "all" },
        "❓",
      );
      if (!react) {
        return;
      }

      const helper = await CommandsManager.collection
        .get("commandinfo")
        .onChatInput(
          interaction.message,
          Object.assign(
            Object.create(CommandInteraction.prototype),
            interaction,
            {
              params: options.name,
            },
          ),
        );
      await helper.whenRunExecuted;
      await Util.sleep(30_000);
      helper.targetMessage.delete();
    };
    helpMessage();

    return false;
  }

  static checkParams() {}

  static createCallMap() {
    const map = new Map();
    const setToMap = (list, command) =>
      list.forEach((item) => map.set(item, command));
    const createList = (command) =>
      [
        command.options.name,
        ...command.options.alias.split(" "),
        command.options.slash?.name,
        String(command.options.id),
      ].filter(Boolean);

    this.collection.each((command) => setToMap(createList(command), command));
    this.callMap = map;
    return map;
  }

  /**
   *
   * @param {import("#lib/BaseCommand").BaseCommand} command
   * @param {CommandInteraction} interaction
   */
  static async execute(command, interaction, { preventCooldown = false } = {}) {
    const context = this.getExecuteContext({
      command,
      interaction,
      preventCooldown,
    });
    const { options, typeBase } = context;

    let execution_context;
    try {
      interaction.user.action(Actions.callCommand, { command, interaction });
      const whenCommandEnd = typeBase.call(command, interaction);

      this.emitter.emit("command", interaction);

      options.cooldown &&
        !preventCooldown &&
        command._cooldown_api(context).call();

      execution_context = await whenCommandEnd;
      if (execution_context instanceof BaseCommandRunContext) {
        await execution_context.whenRunExecuted;
        execution_context.emitter.emit(Events.signal_command_flow_end);
      }

      command._statistic_increase(context);
    } catch (error) {
      await command._error_strategy(error, context, execution_context);
    }
    return execution_context;
  }

  static getExecuteContext(primary) {
    const { command, interaction } = primary;
    const options = command.options;
    const typeBase = Object.values(this.EXECUTION_TYPES).find(({ condition }) =>
      condition(interaction),
    );

    return { ...primary, typeBase, options };
  }

  static async importCommands() {
    const commands = (await new ImportDirectory().import(COMMANDS_PATH)).map(
      ({ default: Command }) => new Command(),
    );

    /**
     * @type [string, import("#lib/BaseCommand.js").BaseCommand][]
     */
    const entries = commands.map((command) => [command.options.name, command]);

    this.collection = new Collection(entries);
  }
}

Executor.bind("command", (target, params) =>
  CommandsManager.callMap.get(target).onComponent(params),
);

export { parseInputCommandFromMessage };
export default CommandsManager;
