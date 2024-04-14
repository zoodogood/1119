import { BaseCommand } from "#lib/BaseCommand.js";
import * as Util from "#lib/util.js";
import { client } from "#bot/client.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { MINUTE } from "#constants/globals/time.js";

class CommandRunContext extends BaseCommandRunContext {}

class Command extends BaseCommand {
  async processAggree(context) {
    const { channel, user, interaction } = context;
    const heAccpet = await Util.awaitUserAccept({
      name: "idea",
      message: {
        title: "<a:crystal:637290417360076822> Подать идею",
        description:
          "После подтверждения этого сообщения, текст, который вы ввели вместе с командой, будет отправлен разработчику.\nВсё идеи попадают **[сюда.](https://discord.gg/76hCg2h7r8)**",
      },
      channel,
      userData: interaction.userData,
    });
    if (heAccpet) {
      return true;
    }
    user.msg({
      title: "Ваша идея не была отправлена, ведь Вы не подтвердили отправку",
      description: `Текст идеи:\n${interaction.params}`,
      color: "#ff0000",
    });
    return false;
  }

  async fetchLastIdeaNumber(channel) {
    const messages = await channel.messages.fetch();
    const lastIdeaMessage = messages.find(
      (message) => message.author === client.user,
    );
    const { author: authorField } = lastIdeaMessage.embeds[0];
    return +Util.match(authorField.name, /#\d+$/).slice(1);
  }
  async run(context) {
    this.processDefaultBehaviour(context);
  }

  async processDefaultBehaviour(context) {
    if (!(await this.processAggree(context))) {
      return;
    }

    const { interaction, user } = context;

    const channel = client.channels.cache.get("753587805195862058");

    const increasedIdeaNumber = (await this.fetchLastIdeaNumber(channel)) + 1;

    channel.msg({
      title: "<:meow:637290387655884800> Какая классная идея!",
      description: `**Идея:**\n${interaction.params}`,
      color: interaction.userData.profile_color || "#00ffaf",
      author: {
        name: `${user.username} #${increasedIdeaNumber}`,
        iconURL: user.avatarURL(),
      },
      reactions: ["814911040964788254", "815109658637369377"],
    });
    channel.msg({
      title: "<:meow:637290387655884800> Вы отправили нам свою идею! Спасибо!",
      description: `А что, идея «${interaction.params}» весьма не плоха...`,
      color: "#00ffaf",
      author: { name: user.username, iconURL: user.avatarURL() },
    });
  }
  async onChatInput(msg, interaction) {
    const context = CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }

  options = {
    name: "idea",
    id: 24,
    media: {
      description:
        "\n\nЕсли у вас есть идеи как можно улучшить бота — с помощью этой команды отправьте её на сервер.\nНе забудьте позже обсудить её в чате, подробно расписывая особенности вы повышаете вероятность того, что она будет реализована.\n\n\n✏️\n```python\n!idea {content}\n```\n\n",
    },
    cliParser: {
      flags: [],
    },
    alias: "идея innovation новвоведение ідея proposal предложение",
    allowDM: true,
    expectParams: true,
    cooldown: MINUTE * 10,
    cooldownTry: 3,
    type: "bot",
  };
}

export default Command;
