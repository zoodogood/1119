import { BaseCommand } from "#lib/BaseCommand.js";
class Command extends BaseCommand {
  async onChatInput(msg, interaction) {
    const type = "logChannel";
    const guild = msg.guild;
    const channel = msg.mentions.channels.first() ?? msg.channel;
    guild.data[type] = channel.id;
    msg.msg({
      title: `Готово. В #${channel.name} будут отправлятся логи сервера`,
      delete: 9000,
    });

    guild.logSend({
      description: `Каналу #${channel.name} установили метку "логи"`,
      author: { name: msg.author.username, avatarURL: msg.author.avatarURL() },
    });
  }

  options = {
    name: "setlogs",
    id: 12,
    media: {
      description:
        "\n\nУстанавливает для бота указанный канал, как логи, иначе говоря — журнал, туда будет записываться информация о применении пользователями небезопасных команд, статистике, важных изменениях и многом другом.\nНастоятельно рекомендуется создать такой канал, если его нет.\n\n✏️\n```python\n!setLogs <channel>\n```\n\n",
    },
    alias: "установитьлоги встановитилоги",
    allowDM: true,
    type: "guild",
    Permissions: 32n,
  };
}

export default Command;
