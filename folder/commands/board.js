import { NULL_WIDTH_SPACE } from "#constants/globals/characters.js";
import { BaseCommand, BaseFlagSubcommand } from "#lib/BaseCommand.js";
import { render_strategies } from "#lib/Board/render/strategies/mod.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { board_singleton, CommandsManager } from "#lib/modules/mod.js";
import { justButtonComponents } from "@zoodogood/utils/discordjs";
import { ButtonStyle, ComponentType, escapeMarkdown } from "discord.js";

class CommandRunContext extends BaseCommandRunContext {}

class Create_FlagSubcommand extends BaseFlagSubcommand {
  constructor(context) {
    super(context);
    this.interaction = context.interaction;
  }
  async displayCreateOutput({ interaction, result, board }) {
    const embed = {
      title: "Табло создано",
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

  async onProcess() {
    const { context } = this;
    const { interaction } = context;

    const x = {
      interaction,
      questionMessage: null,
      boardBase: null,
      template: null,
      board: {},
    };

    const boardBases = [...render_strategies.values()];

    x.questionMessage = await msg.msg({
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
    })(x);
    x.boardBase = boardBase;

    if (!x.boardBase) {
      x.questionMessage.delete();
      return;
    }
    x.questionMessage.msg({
      title: "🪄 Отлично! Введите текст с использованием шаблонов",
      description:
        "Каждые пятнадцать минут табло будет изменять своё значение на основе результата выполнения сценария",
      edit: true,
    });
    x.template = (
      await interaction.channel.awaitMessage({ user: msg.author })
    )?.content;

    x.questionMessage.delete();
    if (!x.template) {
      return;
    }

    if (!x.template.match(/\{(?:.|\n)+?\}/)) {
      interaction.message.msg({
        title: "В сообщении отсуствует сценарий.",
        color: "#ff0000",
        delete: 5000,
      });
      return;
    }

    const board = await boardBase.setup(context);
    if (!board) {
      return;
    }
    await boardBase.render(board);
  }

  process_counters_limit() {
    const { interaction } = this.context;
    if (
      board_singleton.loop.items.filter(
        (board) => board.gid === interaction.guild.id,
      ).length >= 15
    ) {
      interaction.channel.msg({
        title: "Максимум пятнадцать счётчиков",
        color: "#ff0000",
        delete: 12_000,
      });
      return;
    }
  }
}

class CommandDefaultBehavior extends BaseFlagSubcommand {
  onProcess() {
    const { channel } = this.context;

    channel.msg({
      description: "Добро пожаловать!",
      components: justButtonComponents(
        {
          label: "Создать табло",
          style: ButtonStyle.Primary,
          customId: "@command/board/create",
        },
        { label: "Список" },
        { label: "Отредактировать" },
        { label: "Удалить" },
      ),
    });
  }
}

class Command extends BaseCommand {
  componentsCallbacks = {
    create: (context, params) => {
      console.log(context, params);
      context.interaction.msg({ content: "Alive!" });
    },
  };

  options = {
    name: "board",
    id: 42,
    media: {
      description:
        "Отличный способ отображать статистику — с помощью шаблонов создайте динамический текст, который будет меняться каждые пятнадцать минут. Счётчики могут менять как имя любого канала, так и содержание сообщения.",
      example: `!board #без аргументов`,
    },
    accessibility: {
      publicized_on_level: 15,
    },
    alias:
      "табло счётчик счетчик board count counter рахівник счётчики счетчики рахівники counters",
    allowDM: false,
    type: "guild",
    Permissions: 16n,
  };

  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }

  async run(context) {
    new CommandDefaultBehavior(context).onProcess();
  }
}

export default Command;
