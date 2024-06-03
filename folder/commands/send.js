import { BaseCommand } from "#lib/BaseCommand.js";

class Command extends BaseCommand {
  options = {
    name: "send",
    id: 2,
    media: {
      description:
        "Отправляет ваше сообщение от имени призрака. Также это отличная команда для тестирования шаблонов.\nЛичная просьба: Используя команду при разговоре, не нарушайте каноничность характера бота, это действительно важно в первую очередь для меня. Спасибо за понимание :green_heart:",
      example: "!c {text}",
      poster:
        "https://cdn.discordapp.com/attachments/769566192846635010/872441895215824916/send.gif",
    },
    alias: "с c сенд s відправити отправить template шаблон",
    allowDM: true,
    expectParams: true,
    type: "other",
    myChannelPermissions: 8192n,
  };

  async onChatInput(msg, interaction) {
    await msg.msg({ content: `**${interaction.params}**` });

    msg.guild?.logSend({
      title: `${msg.author.username}:`,
      description: `\n!c ${interaction.params}`,
    });
  }
}

export default Command;
