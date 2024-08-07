import { NULL_WIDTH_SPACE } from "#constants/globals/characters.js";
import { BaseCommand } from "#lib/BaseCommand.js";
import { render_strategies } from "#lib/Board/render/strategies/mod.js";
import { board_singleton, CommandsManager } from "#lib/modules/mod.js";
import { ButtonStyle, ComponentType, escapeMarkdown } from "discord.js";

class Command extends BaseCommand {
  options = {
    name: "board",
    id: 42,
    media: {
      description:
        "Отличный способ отображать статистику — с помощью шаблонов создайте динамический текст, который будет меняться каждые 15 минут. Счётчики могут менять как имя любого канала, так и содержание сообщения.",
      example: `!board #без аргументов`,
    },
    accessibility: {
      publicized_on_level: 15,
    },
    alias: "счётчик счетчик count рахівник",
    allowDM: true,
    type: "guild",
    Permissions: 16n,
  };

  async displayCreateOutput({ interaction, result, board }) {
    const embed = {
      title: "Счётчик создан",
      description: `**Результат:** ${
        result instanceof Error ? "исключение" : "успех"
      }.\n${escapeMarkdown(String(result).slice(0, 1000))}`,
      components: [
        {
          type: ComponentType.Button,
          customId: "open-list",
          label: "Показать список счётчиков сервера",
          style: ButtonStyle.Secondary,
        },
        {
          type: ComponentType.Button,
          customId: "delete-board",
          label: "Удалить этот счётчик",
          style: ButtonStyle.Secondary,
        },
      ],
    };
    const message = await interaction.message.msg(embed);

    const filter = ({ user }) => interaction.user === user;
    const collector = message.createMessageComponentCollector({
      max: 1,
      filter,
      time: 100_000,
    });

    const boardsCommand = CommandsManager.callMap.get("boards");
    collector.on("collect", async (interaction) => {
      const { customId } = interaction;
      customId === "delete-board" && CountersManager.delete(board);
      customId === "open-list" &&
        boardsCommand.onChatInput(interaction.message, interaction);
    });
    collector.on("end", () => message.msg({ edit: true, components: [] }));

    return;
  }

  async onChatInput(msg, interaction) {
    if (
      board_singleton.loop.items.filter(
        (board) => board.gid === interaction.guild.id,
      ).length >= 15
    ) {
      interaction.channel.msg({
        title: "Максимум 15 счётчиков",
        color: "#ff0000",
        delete: 12_000,
      });
      return;
    }

    const context = {
      interaction,
      questionMessage: null,
      boardBase: null,
      template: null,
      board: {},
    };

    const boardBases = [...render_strategies.values()];

    context.questionMessage = await msg.msg({
      title: "🪄 Выберите тип объекта для счётчика",
      description: `Счётчики работают с каналами и сообщениями.\nВыберите основу для дальнельшей настройки.\n\n${boardBases
        .map(
          ({ label, description }) =>
            `❯ ${label.toUpperCase()}\n> ${description}.\n> ${NULL_WIDTH_SPACE}`,
        )
        .join("\n")}`,
    });
    const boardBase = await (async (context) => {
      const reactions = boardBases.map(({ emoji }) => emoji);
      const reaction = await context.questionMessage.awaitReact(
        { user: msg.author, removeType: "all" },
        ...reactions,
      );
      return boardBases.find(({ emoji }) => emoji === reaction);
    })(context);
    context.boardBase = boardBase;

    if (!context.boardBase) {
      context.questionMessage.delete();
      return;
    }
    context.questionMessage.msg({
      title: "🪄 Отлично! Введите текст с использованием шаблонов",
      description:
        "Каждые 15 минут счётчик будет изменять своё значение на основе актуальных данных шаблона",
      edit: true,
    });
    context.template = (
      await interaction.channel.awaitMessage({ user: msg.author })
    )?.content;

    context.questionMessage.delete();
    if (!context.template) {
      return;
    }

    if (!context.template.match(/\{(?:.|\n)+?\}/)) {
      interaction.message.msg({
        title: "В сообщении отсуствуют шаблоны.",
        color: "#ff0000",
        delete: 5000,
      });
      return;
    }

    const board = await boardBase.setup(context);
    if (!board) {
      return;
    }
    const { result } = await boardBase.render(board);
    await this.displayCreateOutput({ interaction, result });
  }
}

export default Command;
