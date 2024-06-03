import { BaseCommand } from "#lib/BaseCommand.js";
class Command extends BaseCommand {
  options = {
    name: "avatar",
    id: 41,
    media: {
      description:
        "Отправляет картинку-аватар красивого пользователя <:panda:637290369964310530>\nЕсли вы хотите достичь более хорошего качества чем 128х128px, вам явно понадобится напрямую попросить человека поделится фоточками",
      example: `!avatar <memb>`,
    },
    alias: "аватар",
    allowDM: true,
    cooldown: 12_000,
    type: "other",
  };

  async onChatInput(msg, interaction) {
    const avatarURL = (interaction.mention || msg.author).avatarURL({
      dynamic: true,
    });
    msg.msg({ content: avatarURL });
  }
}

export default Command;
