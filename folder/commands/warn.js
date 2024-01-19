class Command {
  async onChatInput(msg, interaction) {
    const memb = interaction.mention;

    interaction.params = interaction.params.split(" ").slice(1).join(" ");

    if (memb == msg.author) {
      msg.msg({
        title: `${msg.author.username} выдал себе предупреждение за то, что ${
          interaction.params.trim() || "смешной такой"
        }`,
        color: "#ff0000",
      });
      return;
    }

    const message = interaction.params
      ? `Участник ${msg.author.username} выдал предупреждение ${memb.username}\n**Причина:** ${interaction.params}`
      : `${msg.author.username} выдал предупреждение ${memb.username} без объяснения причин.`;

    msg.msg({
      title: "Выдан пред",
      description: `${message}`,
      color: "#ff0000",
      author: {
        name: `Выдал: ${msg.author.username}`,
        iconURL: msg.author.avatarURL(),
      },
      footer: {
        text: "to-do: replace to invisible symbol",
        iconURL: memb.avatarURL(),
      },
    });

    memb.msg({
      title: `Вам выдано предупреждение \nПричина: ${
        interaction.params || "не указана"
      }`,
      color: "#ff0000",
      footer: { text: "Выдал: " + msg.author.tag },
    });
    msg.guild.logSend({
      title: `Одному из участников выдано предупреждение`,
      description: message,
      color: "#ff0000",
    });
  }

  options = {
    name: "warn",
    id: 7,
    media: {
      description:
        "\n\nВыдаёт формальное предупреждение пользователю — —\n\n✏️\n```python\n!warn {memb}\n```\n\n",
    },
    alias: "пред варн попередити",
    expectMention: true,
    allowDM: true,
    cooldown: 120_000,
    type: "guild",
    Permissions: 4194304,
  };
}

export default Command;
