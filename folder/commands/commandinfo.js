import { BaseCommand } from "#lib/BaseCommand.js";
import DataManager from "#lib/modules/DataManager.js";
import * as Util from "#lib/util.js";

import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import CommandsManager from "#lib/modules/CommandsManager.js";
import { permissionsBitsToI18nArray } from "#lib/permissions.js";
import { justButtonComponents } from "@zoodogood/utils/discordjs";
import { CliParser } from "@zoodogood/utils/primitives";
import Discord from "discord.js";

class CliFlagsField {
  constructor(context) {
    this.context = context;
  }
  flagToString(flag) {
    const { capture, expectValue } = flag;
    const isMultiple = capture.length > 1;
    const toString = (capture) =>
      `\`${expectValue ? `${capture} {}` : capture}\``;

    const content = capture.map(toString).join("|");
    return isMultiple ? `[${content}]` : content;
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
}

class FlagsCommandManager {
  constructor(context) {
    this.context = context;
  }

  async onProcess() {
    const { context } = this;
    await this.sendFlags(context.channel);
  }

  sendFlags(channel) {
    const {
      meta: { options },
    } = this.context;
    const { name, cliParser } = options;

    const description =
      cliParser?.flags
        .map((flag) => {
          const title = CliFlagsField.prototype.flagToString(flag);
          const { description, example } = flag;
          return `- ${title}\n${example ? `✏️ ${example}\n` : ""}${description}`;
        })
        .join("\n") || "Здесь пусто..";
    channel.msg({ title: `Флаги команды ${name}`, description });
  }
}

class CommandRunContext extends BaseCommandRunContext {
  addableFields = [];
  cliParsed;
  meta;
  targetCommand;
  targetMessage;

  static new(interaction, command) {
    const context = new this(interaction, command);
    context.parseCli();
    context.processCommandInfo();
    if (!context.meta) {
      return context;
    }
    context.processFlags();
    return context;
  }

  parseCli() {
    const parser = new CliParser().setText(this.interaction.params);

    const parsed = parser
      .processBrackets()
      .captureFlags(this.command.options.cliParser.flags)
      .captureResidueFlags()
      .captureByMatch({
        name: "commandRaw",
        regex: /[a-zа-яёъ0-9]+/i,
        valueOf: (capture) => capture?.toString().toLowerCase(),
      })
      .collect();

    const values = parsed.resolveValues((capture) => capture?.toString());
    this.setCliParsed(parsed, values);
  }

  processCommandInfo() {
    const values = this.cliParsed.at(1);
    const raw = values.get("commandRaw");
    if (!raw) {
      return null;
    }
    this.setTargetCommand(CommandsManager.callMap.get(raw));

    this.setCommandMeta(
      this.targetCommand ? TargetCommandMetadata.new(this) : null,
    );
    return this;
  }

  processFlags() {
    const { meta } = this;
    if (!meta) {
      return;
    }
    new CliFlagsField(this).processFlags();
  }

  setCommandMeta(meta) {
    this.meta = meta;
    return this;
  }

  setTargetCommand(command) {
    this.targetCommand = command;
    return this;
  }
}

class TargetCommandMetadata {
  static CategoriesEnum = {
    dev: "Команда в разработке или доступна только разработчику",
    delete: "Команда была удалена",
    guild: "Управление сервером",
    user: "Пользователи",
    bot: "Бот",
    other: "Другое",
  };
  aliases;
  category;
  commandNameId;
  githubURL;
  id;
  media;
  options;
  usedCount;
  static new(context) {
    const meta = new this();
    Object.assign(meta, meta.fetchCommandMetadata(context.targetCommand));
    return meta;
  }

  calculateCommandsUsedTotally() {
    const used = Object.values(DataManager.data.bot.commandsUsed);
    return used.reduce((acc, count) => acc + count, 0);
  }

  fetchCommandMetadata(command) {
    const { options } = command;
    const { id } = options;
    const commandNameId = options.name;
    const category = options.type;
    const aliases = options.alias.split(" ");
    const githubURL = this.resolveGithubPathOf(commandNameId);
    const media = options.media;
    const usedCount =
      DataManager.data.bot.commandsUsed[command.options.id] || 0;

    return {
      options,
      id,
      category,
      commandNameId,
      aliases,
      media,
      usedCount,
      githubURL,
    };
  }

  permissionsToLocaledArray(permissions, locale) {
    const strings = permissionsBitsToI18nArray(permissions, locale);
    const formatted = strings.map((permission) => {
      return permission.toLowerCase();
    });

    return Util.capitalize(Util.joinWithAndSeparator(formatted));
  }

  resolveGithubPathOf(commandNameId) {
    return Util.resolveGithubPath(`./folder/commands/${commandNameId}.js`);
  }

  get commandUsedTotally() {
    return this.calculateCommandsUsedTotally();
  }
}

class Command extends BaseCommand {
  static MESSAGE_THEME = {
    poster:
      "https://media.discordapp.net/attachments/629546680840093696/963343808886607922/disboard.jpg",
  };
  componentsCallbacks = {
    async display({ interaction, params }) {
      const [commandName] = params;
      interaction.params = commandName;
      const context = await CommandRunContext.new(interaction, this);
      await this.processDefaultBehaviour(context);
    },
    async flags_of({ interaction, params }) {
      const [commandName] = params;
      interaction.params = `${commandName} --flags`;
      const context = await CommandRunContext.new(interaction, this);
      await this.run(context);
    },
  };
  options = {
    name: "commandinfo",
    id: 53,
    media: {
      description:
        "Показывает информацию об указанной команде, собственно, на её основе вы и видите это сообщение",
      example: `!commandInfo {command}`,
    },
    cliParser: {
      flags: [
        {
          name: "--flags",
          capture: ["-f", "--flags"],
          description: "Отображает флаги целевой команды и их описания",
        },
      ],
    },
    alias: "command команда command_info",
    allowDM: true,
    expectParams: true,
    cooldown: 5_000,
    type: "bot",
  };

  formatMediaDescription(media) {
    const { description, example } = media;
    const exampleContent = `\n\n✏️\n\`\`\`python\n${example}\n\`\`\``;
    return `${description ?? "Описание для этой команды пока отсуствует..."}${example ? exampleContent : ""}`;
  }
  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }

  processCommandExists(context) {
    const { targetCommand } = context;

    if (!targetCommand) {
      this.sendHelpMessage(context);
      return;
    }

    return true;
  }

  async processDefaultBehaviour(context) {
    const { meta, user, interaction } = context;
    const {
      aliases,
      commandNameId,
      media,
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
      description: this.formatMediaDescription(media).trim(),
      color: "#1f2022",
      image: media.poster || Command.MESSAGE_THEME.poster,
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
      components: justButtonComponents(
        ...[
          context.addableFields.length && {
            label: "Показать флаги",
            customId: `@command/commandinfo/flags_of:${commandNameId}`,
          },
        ].filter(Boolean),
      ),
    };
    const message = await interaction.msg(embed);
    context.targetMessage = message;
    return true;
  }

  async processFlagsFlag(context) {
    const values = context.cliParsed.at(1);
    if (!values.get("--flags")) {
      return;
    }
    await new FlagsCommandManager(context).onProcess();
    return true;
  }

  async run(context) {
    if (!(await this.processCommandExists(context))) {
      return;
    }
    if (await this.processFlagsFlag(context)) {
      return;
    }
    return await this.processDefaultBehaviour(context);
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
}

export default Command;
