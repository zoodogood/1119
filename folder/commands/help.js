import { BaseCommand } from "#lib/BaseCommand.js";
import CommandsManager from "#lib/modules/CommandsManager.js";
import { ButtonStyle, ComponentType } from "discord.js";

class Guidances {
  guidances = [
    {
      id: "basics",
      label: "Основы",
    },
  ];

  get selectOptions() {
    return this.guidances.map(({ id, label }) => ({ label, value: id }));
  }
}

class Command extends BaseCommand {
  options = {
    name: "help",
    id: 4,
    slash: {
      name: "help",
      description: "Have a nice {{advanced}}",
    },
    media: {
      description:
        "Стандартная команда отображающую основную информацию о возможностях бота. Она нужна чтобы помочь новым пользователям. Её так же можно вызвать отправив `/help`",
      example: `!help #без аргументов`,
    },
    alias: "хелп помощь cmds commands команды х допомога info інфо",
    allowDM: true,
    cooldown: 15_000,
    type: "other",
  };

  createGuidances() {
    return new Guidances();
  }

  async onChatInput(msg, interaction) {
    this.run(interaction);
  }

  onComponent({ params, interaction }) {
    const content =
      "Новая года. Читатель, люби каждый день как новый год. Люби новый год за то, что ты можешь выйти на улицу и увидеть вокруг себя людей. Или опустевшие улицы";

    params === "guidances-preview" &&
      interaction.msg({
        content,
        ephemeral: true,
      });
  }

  async onSlashCommand(interaction) {
    await interaction.msg({
      description: ":green_book:",
    });
    this.run(interaction);
  }

  run(interaction) {
    const guildCommands = [];
    const commands = CommandsManager.collection;
    const { level: userLevel } = interaction.user.data;
    const isHidden = ({ options }) =>
      options.hidden ||
      options.type === "dev" ||
      options.removed ||
      options.accessibility?.publicized_on_level > userLevel;

    const pretty_format = (command) => `\`!${command.options.name}\``;

    // to-do: developer crutch. Restore when interaction.guild?.data.commands analized and changed
    if (false && interaction.guild?.data.commands) {
      const list = interaction.guild.data.commands;
      guildCommands.push({
        name: "Кастомные команды <:cupS:806813704913682442>",
        value: list.map(pretty_format).join(" "),
      });
    }

    const fields = [
      {
        name: "Управление сервером <a:diamond:725600667586134138>",
        value: commands
          .filter(
            (command) => command.options.type === "guild" && !isHidden(command),
          )
          .map(pretty_format)
          .join(" "),
      },
      {
        name: "Пользователи <:berry:756114492055617558>",
        value: commands
          .filter(
            (command) => command.options.type === "user" && !isHidden(command),
          )
          .map(pretty_format)
          .join(" "),
      },
      {
        name: "Бот <:piggeorg:758711403027759106>",
        value: commands
          .filter(
            (command) => command.options.type === "bot" && !isHidden(command),
          )
          .map(pretty_format)
          .join(" "),
      },
      ...guildCommands,
      {
        name: "Другое <:coin:637533074879414272>",
        value: commands
          .filter(
            (command) => command.options.type === "other" && !isHidden(command),
          )
          .map(pretty_format)
          .join(" "),
      },
    ];

    const EMBED_COMPONENT_PUBLIZED_ON_LEVEL = 3;
    const embed = {
      title: "Команды, которые не сломают ваш сервер",
      description: `Знаете все-все мои возможности? Вы точно молодец!`,
      fields,
      components:
        userLevel > EMBED_COMPONENT_PUBLIZED_ON_LEVEL
          ? [
              {
                type: ComponentType.Button,
                label: "Discord",
                style: ButtonStyle.Link,
                url: "https://discord.gg/76hCg2h7r8",
                emoji: { id: "849587567564554281" },
              },
              {
                type: ComponentType.Button,
                label: "Тишком-нишком",
                customId: "@command/help/guidances-preview",
                style: ButtonStyle.Primary,
                emoji: "❄️",
                // options: this.createGuidances().selectOptions
              },
            ]
          : [],
    };

    interaction.channel.msg(embed);
  }
}

export default Command;
