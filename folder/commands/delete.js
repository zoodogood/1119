import { BaseCommand } from "#lib/BaseCommand.js";
class Command extends BaseCommand {
  options = {
    name: "delete",
    id: 1,
    media: {
      description:
        "Шуточная команда, при попытке пользователем что-то удалить отправляет сообщение с требованием купить премиум и ссылкой на картофильное видео.",
      example: `# secret`,
    },
    accessibility: {
      publicized_on_level: 10,
    },
    alias: "удалить удали видалити видали",
    allowDM: true,
    cooldown: 5_000,
    type: "other",
  };

  async onChatInput(msg, interaction) {
    if (!interaction.params) {
      return;
    }

    msg.msg({
      description:
        "Эта бонусная функция доступна только для пользователей поддерживающих нас :green_heart: \nХотите быть одним из них? [**Поддержите нас!**](https://www.youtube.com/watch?v=MX-CO5i5S9g)",
    });
  }
}

export default Command;
