import { BaseCommand } from "#lib/BaseCommand.js";
import * as Util from "#lib/util.js";
import DataManager from "#lib/modules/DataManager.js";

import Discord from "discord.js";
import CommandsManager from "#lib/modules/CommandsManager.js";
import { permissionsBitsToI18nArray } from "#lib/permissions.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";

class CliFlagsField {
  constructor(context) {
    this.context = context;
  }
  processFlags() {
    const {
      targetCommand: { options },
    } = this.context;
    const flags = options.cliParser?.flags;
    if (!flags) {
      return;
    }
    this.context.addableFields.push({
      name: "Флаги команды:",
      value: flags.map((flag) => this.flagToString(flag)).join(", "),
    });
  }

  flagToString(flag) {
    const { capture, expectValue } = flag;
    const isMultiple = capture.length > 1;
    const toString = (capture) =>
      `\`${expectValue ? `${capture} {}` : capture}\``;

    const content = capture.map(toString).join("|");
    return isMultiple ? `[${content}]` : content;
  }
}

class CommandRunContext extends BaseCommandRunContext {
  targetCommand;
  params;
  meta;
  addableFields = [];

  static new(interaction, command) {
    const context = new this(interaction, command);
    context.processParams();
    context.processCommandInfo();
    if (!context.meta) {
      return context;
    }
    context.processFlags();
    return context;
  }

  setTargetCommand(command) {
    this.targetCommand = command;
    return this;
  }

  setCommandMeta(meta) {
    this.meta = meta;
    return this;
  }

  processCommandInfo() {
    this.setTargetCommand(
      CommandsManager.callMap.get(this.params.commandRaw),
    ).setCommandMeta(
      this.targetCommand ? TargetCommandMetadata.new(this) : null,
    );
    return this;
  }

  processParams() {
    const { interaction } = this;
    const commandRaw = interaction.params
      .toLowerCase()
      .replace(/[^a-zа-яёьъ0-9]/g, "")
      .trim();

    const params = {
      commandRaw,
    };
    Object.assign(this, { params });
    return true;
  }

  processFlags() {
    const { meta } = this;
    if (!meta) {
      return;
    }
    new CliFlagsField(this).processFlags();
  }
}

class TargetCommandMetadata {
  id;
  options;
  category;
  commandNameId;
  aliases;
  guide;
  poster;
  usedCount;
  githubURL;
  static new(context) {
    const meta = new this();
    Object.assign(meta, meta.fetchCommandMetadata(context.targetCommand));
    return meta;
  }
  static CategoriesEnum = {
    dev: "Команда в разработке или доступна только разработчику",
    delete: "Команда была удалена",
    guild: "Управление сервером",
    user: "Пользователи",
    bot: "Бот",
    other: "Другое",
  };

  resolveGithubPathOf(commandNameId) {
    return Util.resolveGithubPath(`./folder/commands/${commandNameId}.js`);
  }

  permissionsToLocaledArray(permissions, locale) {
    const strings = permissionsBitsToI18nArray(permissions, locale);
    const formatted = strings.map((permission) => {
      return permission.toLowerCase();
    });

    return Util.capitalize(Util.joinWithAndSeparator(formatted));
  }

  fetchCommandMetadata(command) {
    const { options } = command;
    const { id } = options;
    const commandNameId = options.name;
    const category = options.type;
    const aliases = options.alias.split(" ");
    const poster = options.media?.poster;
    const githubURL = this.resolveGithubPathOf(commandNameId);
    const guide =
      options.media?.description ||
      "Описание для этой команды пока отсуствует...";
    const usedCount =
      DataManager.data.bot.commandsUsed[command.options.id] || 0;

    return {
      options,
      id,
      category,
      commandNameId,
      aliases,
      guide,
      poster,
      usedCount,
      githubURL,
    };
  }

  get commandUsedTotally() {
    return this.calculateCommandsUsedTotally();
  }

  calculateCommandsUsedTotally() {
    const used = Object.values(DataManager.data.bot.commandsUsed);
    return used.reduce((acc, count) => acc + count, 0);
  }
}

class Command extends BaseCommand {
  async run(context) {
    const { meta, targetCommand, user, channel } = context;

    if (!targetCommand) {
      this.sendHelpMessage(context);
      return;
    }

    const {
      aliases,
      commandNameId,
      guide,
      poster,
      usedCount,
      githubURL,
      id,
      category,
      commandUsedTotally,
    } = meta;

    const locale = user.data.locale;

    const usedPercentage =
      +((usedCount / commandUsedTotally) * 100).toFixed(1) + "%";

    const embed = {
      title: `— ${commandNameId.toUpperCase()}`,
      description: guide.trim(),
      color: "#1f2022",
      image:
        poster ||
        "https://media.discordapp.net/attachments/629546680840093696/963343808886607922/disboard.jpg",
      fields: [
        {
          name: "Другие способы вызова:",
          value: Discord.escapeMarkdown(
            aliases.map((name) => `!${name}`).join(" "),
          ),
        },
        {
          name: "Категория:",
          value: `${TargetCommandMetadata.CategoriesEnum[category]}${
            githubURL ? `\n[Просмотреть в Github ~](${githubURL})` : ""
          }`,
        },
        {
          name: "Необходимые права",
          value:
            meta.permissionsToLocaledArray(meta.Permissions, locale) || "Нет",
        },
        {
          name: "Количество использований",
          value: `${usedCount} (${usedPercentage})`,
        },
        ...context.addableFields,
      ],
      footer: { text: `Уникальный идентификатор команды: ${id}` },
    };
    const message = await channel.msg(embed);
    return message;
  }

  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    this.run(context);
    return context;
  }

  async sendHelpMessage(context) {
    const { interaction } = context;
    const { channel, user } = interaction;
    const helpMessage = await channel.msg({
      title: "Не удалось найти команду",
      description: `Не существует вызова \`!${interaction.params}\`\nВоспользуйтесь командой !хелп или нажмите реакцию ниже для получения списка команд.\nНа сервере бота Вы можете предложить псевдонимы для вызова одной из существующих команд.`,
    });
    const react = await helpMessage.awaitReact(
      { user, removeType: "all" },
      "❓",
    );
    if (!react) {
      return;
    }

    await CommandsManager.callMap
      .get("help")
      .onChatInput(interaction.message, interaction);

    return;
  }

  options = {
    name: "commandinfo",
    id: 53,
    media: {
      description:
        "Показывает информацию об указанной команде, собственно, на её основе вы и видите это сообщение\n\n✏️\n```python\n!commandInfo {command}\n```\n\n",
    },
    alias: "command команда",
    allowDM: true,
    expectParams: true,
    cooldown: 5_000,
    type: "bot",
  };
}

export default Command;
