import * as Util from "#lib/util.js";
import DataManager from "#lib/modules/DataManager.js";

import Discord from "discord.js";
import CommandsManager from "#lib/modules/CommandsManager.js";
import { permissionsBitsToI18nArray } from "#lib/permissions.js";

class Command {
  getContext(interaction) {
    const params = interaction.params
      .toLowerCase()
      .replace(/[^a-zа-яёьъ0-9]/g, "")
      .trim();

    const command = CommandsManager.callMap.get(params);
    const meta = command ? this.fetchCommandMetadata(command) : null;
    return {
      command,
      params,
      meta,
      interaction,
    };
  }

  async onChatInput(msg, interaction) {
    const __inServer = msg.channel.id === "753687864302108913";

    const context = this.getContext(interaction);
    const { meta, command } = context;

    if (!command) {
      this.sendHelpMessage(context);
      return;
    }

    const {
      alliases,
      commandNameId,
      guide,
      poster,
      usedCount,
      githubURL,
      id,
      category,
    } = meta;

    const locale = interaction.user.data.locale;

    const commandUsedTotally = this.calculateCommandsUsedTotally();

    const usedPercentage =
      +((usedCount / commandUsedTotally) * 100).toFixed(1) + "%";

    const embed = {
      title: `— ${commandNameId.toUpperCase()}`,
      description:
        guide.trim() +
        (__inServer
          ? `\nДругие названия:\n${alliases
              .map((name) => `!${name}`)
              .join(" ")}`
          : ""),
      color: __inServer ? null : "#1f2022",
      image:
        poster ||
        (__inServer
          ? null
          : "https://media.discordapp.net/attachments/629546680840093696/963343808886607922/disboard.jpg"),
      fields: __inServer
        ? null
        : [
            {
              name: "Другие способы вызова:",
              value: Discord.escapeMarkdown(
                alliases.map((name) => `!${name}`).join(" "),
              ),
            },
            {
              name: "Категория:",
              value: `${this.CategoriesEnum[category]}${
                githubURL ? `\n[Просмотреть в Github ~](${githubURL})` : ""
              }`,
            },
            {
              name: "Необходимые права",
              value:
                this.permissionsToLocaledArray(meta.Permissions, locale) ||
                "Нет",
            },
            {
              name: "Количество использований",
              value: `${usedCount} (${usedPercentage})`,
            },
          ],
      footer: __inServer
        ? null
        : { text: `Уникальный идентификатор команды: ${id}` },
    };
    const message = await msg.msg(embed);
    return message;
  }

  CategoriesEnum = {
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
    const commandNameId = command.options.name;
    const category = command.options.type;
    const alliases = command.options.allias.split(" ");
    const poster = command.options.media?.poster;
    const githubURL = this.resolveGithubPathOf(commandNameId);
    const guide =
      command.options.media?.description ||
      "Описание для этой команды пока отсуствует...";
    const usedCount =
      DataManager.data.bot.commandsUsed[command.options.id] || 0;

    return {
      ...command.options,
      category,
      commandNameId,
      alliases,
      guide,
      poster,
      usedCount,
      githubURL,
    };
  }

  calculateCommandsUsedTotally() {
    const used = Object.values(DataManager.data.bot.commandsUsed);
    return used.reduce((acc, count) => acc + count, 0);
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
    allias: "command команда",
    allowDM: true,
    expectParams: true,
    cooldown: 5_000,
    type: "bot",
  };
}

export default Command;
