import { BaseCommand } from "#lib/BaseCommand.js";
import { board_singleton } from "#lib/modules/mod.js";
import * as Util from "#lib/util.js";
import Discord from "discord.js";

class Command extends BaseCommand {
  options = {
    name: "boards",
    id: 43,
    media: {
      description:
        "Отображает список существующих счётчиков на сервере. См. команду `!board`",
      example: `!boards #без аргументов`,
    },
    accessibility: {
      publicized_on_level: 15,
    },
    alias: "счётчики счетчики рахівники",
    allowDM: false,
    cooldown: 10_000_000,
    type: "guild",
  };

  createEmbed({ interaction, boards }) {
    const toValue = (board) =>
      ({
        message: `🖊️ [Сообщение.](https://discord.com/channels/${board.gid}/${board.cid}/${board.mid})`,
        channel: `🪧 \`#${
          interaction.guild.channels.cache.get(board.channelId).name
        }\``,
        poster: `🖌️ <#${board.cid}>`,
      })[board.key];

    const toField = (board, i) => ({
      name: `**${i + 1}.**`,
      value: toValue(board),
      inline: true,
    });

    const fields = boards.map(toField);

    !fields.length &&
      fields.push({
        name: "Но здесь пусто.",
        value: "Чтобы добавить счётчики, используйте `!board`",
      });

    return {
      title: "Счётчики сервера",
      fields,
    };
  }

  fetchBoardsInGuild(guild) {
    return board_singleton.loop.items.filter((board) => board.gid === guild.id);
  }

  async onChatInput(msg, interaction) {
    const boards = this.fetchBoardsInGuild(interaction.guild);
    const embed = this.createEmbed({ interaction, boards });

    const message = await msg.msg(embed);

    const reactions = () =>
      boards.length && !interaction.user.wastedPermissions(16)[0]
        ? ["✏️", "🗑️"]
        : ["❌"];
    let react, question, answer, board;
    while (true) {
      react = await message.awaitReact(
        { user: msg.author, removeType: "all" },
        ...reactions(),
      );
      switch (react) {
        case "🗑️":
          question = await msg.msg({
            title: "Введите номер счётчика, для его удаления",
          });
          answer = await Util.awaitReactOrMessage(question, msg.author, "❌");
          question.delete();
          if (
            !answer ||
            !answer.content ||
            isNaN(answer.content) ||
            answer.content > boards.length
          )
            break;
          board = boards.splice(answer.content - 1, 1)[0];
          BoardManager.delete(board._original);
          boards.forEach((e, i) => (e.name = `**${i + 1}.**`));
          message.msg({
            title: "Счётчики сервера",
            edit: true,
            fields: boards[0]
              ? boards
              : { name: "Тут пусто.", value: "Вы удалили последний счётчик" },
            description: `Счётчик #${answer.content} успешно удалён.`,
          });
          break;
        case "✏️":
          question = await msg.msg({
            title: "Введите номер счётчика, для его редактирования",
          });
          answer = await Util.awaitReactOrMessage(question, msg.author, "❌");

          if (
            !answer ||
            !answer.content ||
            isNaN(answer.content) ||
            answer.content - 1 > boards.length
          ) {
            question.delete();
            msg.msg({
              title: "Элемента с таким номером не существует",
              color: "#ff0000",
            });
            break;
          }

          board = boards[answer.content - 1];
          question.msg({
            title: "Введите новое содержание",
            edit: true,
            description: `**Старое:**\n\`\`\`${Discord.escapeCodeBlock(
              board._original.template,
            )}\`\`\``,
          });
          answer = await msg.channel.awaitMessage(msg.author);
          question.delete();
          board._original.template = answer.content;
          BoardManager.up(board._original);

          message.msg({
            title: "Счётчики сервера",
            edit: true,
            fields: boards,
            description: `Сообщение счётчика успешно отредактированно!`,
          });
          break;
        default:
          return message.delete();
      }
    }
  }
}

export default Command;
