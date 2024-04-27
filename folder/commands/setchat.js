import { BaseCommand } from "#lib/BaseCommand.js";
class Command extends BaseCommand {
  async onChatInput(msg, interaction) {
    const type = "chatChannel";
    const guild = msg.guild;
    const channel = msg.mentions.channels.first() ?? msg.channel;
    guild.data[type] = channel.id;
    msg.msg({ title: `#${channel.name} канал стал чатом!`, delete: 9000 });

    guild.logSend({
      description: `Каналу #${channel.name} установили метку "чат"`,
      author: { name: msg.author.username, avatarURL: msg.author.avatarURL() },
    });
  }

  options = {
    name: "setchat",
    id: 11,
    media: {
      description:
        "Устанавливает для бота указанный канал, как чат, туда будет отправляться ежедневная статистика, а также не будут удалятся сообщения о повышении уровня.",
      example: `!setChat <channel>`,
    },
    alias: "установитьчат встановитичат",
    allowDM: true,
    type: "guild",
    Permissions: 32n,
  };
}

export default Command;
