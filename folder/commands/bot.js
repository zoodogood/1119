import { getAddress, timestampToDate, ending, dayjs } from "#lib/util.js";
import { client } from "#bot/client.js";
import config from "#config";
import DataManager from "#lib/modules/DataManager.js";
import CommandsManager from "#lib/modules/CommandsManager.js";
import app from "#app";
import ErrorsHandler from "#lib/modules/ErrorsHandler.js";

import { CreateModal } from "@zoodogood/utils/discordjs";
import { ButtonStyle, ComponentType, TextInputStyle } from "discord.js";
import { generateInviteFor } from "#lib/util.js";

class Command {
  onComponent({ params: rawParams, interaction }) {
    const [target, ...params] = rawParams.split(":");
    this.componentsCallbacks[target].call(this, interaction, ...params);
  }

  getMainInterfaceComponents() {
    const components = [
      {
        type: ComponentType.Button,
        label: "Больше",
        style: ButtonStyle.Success,
        customId: "@command/bot/getMoreInfo",
      },
      {
        type: ComponentType.Button,
        label: "Сервер",
        style: ButtonStyle.Link,
        url: config.guild.url,
        emoji: { name: "grempen", id: "753287402101014649" },
      },
      {
        type: ComponentType.Button,
        label: "Пригласить",
        style: ButtonStyle.Link,
        url: generateInviteFor(client),
        emoji: { name: "berry", id: "756114492055617558" },
      },
    ];
    return components;
  }

  displayMainInterface(interaction) {
    const { rss, heapTotal } = process.memoryUsage();
    const address = app.server && getAddress(app.server);

    const season = ["Зима", "Весна", "Лето", "Осень"][
      Math.floor((new Date().getMonth() + 1) / 3) % 4
    ];
    const version = app.version ?? "0.0.0";

    const contents = {
      ping: `<:online:637544335037956096> Пинг: ${client.ws.ping}`,
      version: `V${version}`,
      season: `[#${season}](https://hytale.com/supersecretpage)`,
      guilds: `Серваков...**${client.guilds.cache.size}**`,
      commands: `Команд: ${CommandsManager.collection.size}`,
      time: `Время сервера: ${new Intl.DateTimeFormat("ru-ru", {
        hour: "2-digit",
        minute: "2-digit",
      }).format()}`,
      address: address ? `; Доступен по адрессу: ${address}` : "",
      performance: `\`${(heapTotal / 1024 / 1024).toFixed(2)} мб / ${(
        rss /
        1024 /
        1024
      ).toFixed(2)} МБ\``,

      errors: `Паник за текущий сеанс: ${Number(
        ErrorsHandler.actualSessionMetadata().errorsCount,
      )}`,
      uniqueErrors: `Уникальных паник: ${
        ErrorsHandler.actualSessionMetadata().uniqueErrors.size
      }`,
    };

    const embed = {
      title: "ну типа.. ай, да, я живой, да",
      description: `${contents.ping} ${contents.version} ${contents.season}, что сюда ещё запихнуть?\n${contents.guilds}(?) ${contents.commands}\n${contents.performance}\n${contents.time}${contents.address}\n${contents.errors};\n${contents.uniqueErrors}`,
      footer: {
        text: `Укушу! Прошло времени с момента добавления бота на новый сервер: ${
          DataManager.data.bot.addToNewGuildAt
            ? timestampToDate(
                Date.now() - DataManager.data.bot.addToNewGuildAt,
                2,
              )
            : "Вечность"
        }`,
      },
      components: this.getMainInterfaceComponents(),
    };

    interaction.channel.msg(embed);
  }

  componentsCallbacks = {
    removeMessage(interaction) {
      interaction.message.delete();

      interaction.msg({
        title: "Сообщение удалено",
        description:
          "Зачем удалено, почему удалено, что было бы если бы вы не удалили это сообщение, имело ли это какой-нибудь скрытый смысл...?",
        author: {
          name: interaction.member.user.username,
          iconURL: interaction.user.avatarURL(),
        },
      });
      return;
    },
    async getMoreInfo(interaction) {
      const parent = interaction.message;
      const embed = {
        components: [
          {
            type: ComponentType.Button,
            label: "Удалить!",
            style: ButtonStyle.Primary,
            customId: "@command/bot/removeMessage",
          },
          {
            type: ComponentType.Button,
            label: "Быстрая связь",
            style: ButtonStyle.Primary,
            customId: "@command/bot/postReview",
          },
          {
            type: ComponentType.Button,
            label: "Аптайм",
            style: ButtonStyle.Secondary,
            customId: "@command/bot/getUptime",
          },
          {
            type: ComponentType.Button,
            label: "Команды",
            style: ButtonStyle.Secondary,
            customId: "@command/bot/commands",
          },
        ],
      };

      interaction.msg(embed);

      const components = this.getMainInterfaceComponents();
      components.at(0).disabled = true;

      parent.msg({ edit: true, components });
      return;
    },
    getUptime(interaction) {
      const ms = process.uptime() * 1_000;
      const formatted = dayjs
        .duration(ms)
        .format("DD д., HH ч. : mm м. : ss с.");

      const content = `Аптайм: [${formatted}], — бот запущен и работал без перезапусков именно столько.`;
      interaction.msg({ content, delete: 15_000 });
    },
    commands(interaction) {
      const content = this.commandsUsedContent();
      interaction.msg({ ephemeral: true, content });
    },
    postReview(interaction) {
      const components = [
        {
          type: ComponentType.TextInput,
          customId: "content",
          style: TextInputStyle.Paragraph,
          label: "Введите вопрос, отзыв или веселую шутку",
          maxLength: 2000,
        },
      ];

      const modal = CreateModal({
        components,
        customId: "@command/bot/postReviewModal",
        title: "Отправить",
      });

      interaction.showModal(modal);
      return;
    },
    postReviewModal(interaction) {
      const description = interaction.fields.getField("content").value;
      const { user } = interaction;

      const embed = {
        author: {
          iconURL: client.user.avatarURL(),
          name: `Получен отзыв из сервера с ${ending(
            interaction.guild ? interaction.guild.memberCount : 0,
            "участник",
            "ами",
            "ом",
            "ами",
          )}\nСодержимое:`,
        },
        description,
        footer: { text: `${user.tag} | ${user.id}`, iconURL: user.avatarURL() },
        components: [
          {
            type: ComponentType.Button,
            label: "Ответить",
            customId: `@command/bot/answerForReview:${user.id}`,
            style: ButtonStyle.Success,
          },
        ],
      };

      config.developers?.forEach((id) => {
        const user = client.users.cache.get(id);
        user?.msg(embed);
      });

      interaction.msg({
        ephemeral: true,
        content: "Спасибо!",
      });
    },
    answerForReview(interaction, id) {
      const user = client.users.cache.get(id);
      if (!user) {
        interaction.msg({
          ephemeral: true,
          color: "#ff0000",
          description: "Неудалось найти пользователя",
        });
        return;
      }

      const components = [
        {
          type: ComponentType.TextInput,
          customId: "content",
          style: TextInputStyle.Paragraph,
          label: "Если что вдруг",
          placeholder: "По пятницам я не отвечаю",
          maxLength: 2000,
        },
      ];

      const modal = CreateModal({
        components,
        customId: `@command/bot/answerForReviewModal:${id}`,
        title: `Ответ ${user.username}'у`,
      });

      interaction.showModal(modal);
      return;
    },
    async answerForReviewModal(interaction, id) {
      const description = interaction.fields.getField("content").value;
      const user = client.users.cache.get(id);

      const embed = {
        author: {
          iconURL: interaction.user.avatarURL(),
          name: "Получен ответ на ваше сообщение",
        },
        description,
        color: "#6534bf",
        footer: {
          text: `Ответ предоставил ${interaction.user.tag}. Если вы хотите отреагировать, свяжитесь напрямую с пользователем, ответившим вам`,
        },
        image:
          "https://media.discordapp.net/attachments/629546680840093696/1073849735850508339/simple-black-rounded-line.png?width=559&height=559",
      };

      const message = await user.msg(embed);

      Object.assign(embed, {
        reference: message.id,
        description: `<t:${Math.floor(
          interaction.message.createdTimestamp / 1_000,
        )}>\n>>> ${interaction.message.embeds.at(0).description}`,
        author: {
          name: "Содержимое вашего сообщения:",
          iconURL: user.avatarURL(),
        },
        color: "#3260a8",
        footer: null,
        components: [
          {
            type: ComponentType.Button,
            label: "Спрятать",
            style: ButtonStyle.Secondary,
            customId: "@command/bot/hideMessage",
          },
        ],
      });

      await user.msg(embed);

      interaction.msg({
        ephemeral: true,
        content: "Ваш ответ дошёл до пользователя!",
      });
    },
    hideMessage(interaction) {
      interaction.message.delete();
      interaction.msg({
        ephemeral: true,
        content:
          "Совет: используйте команду !клир, чтобы очистить ненужные сообщения в этом чате",
      });
      return;
    },
  };

  async onChatInput(msg, interaction) {
    this.displayMainInterface(interaction);
  }

  commandsUsedContent() {
    const getThreeQuotes = () => "`".repeat(3);
    const list = Object.entries(DataManager.data.bot.commandsUsed)
      .sortBy(1, true)
      .map(
        ([id, uses], i) =>
          `${String(i + 1) + ".".repeat(2 - String(i + 1).length)}.${
            CommandsManager.callMap.get(id).options.name
          }_${uses}(${+(
            (uses / DataManager.data.bot.commandsLaunched) *
            100
          ).toFixed(2)})%`,
      );
    const maxLength = Math.max(...list.map((stroke) => stroke.length));

    const lines = list.map(
      (stroke) => `${stroke} ${" ".repeat(maxLength + 7 - stroke.length)}`,
    );

    let stroke = "";
    while (lines.length) {
      stroke += `${lines.splice(0, 2).join(" ")}\n`;
    }

    return `${getThreeQuotes()}js\nТут такое было.. ого-го\nᅠ\n${stroke}ᅠ${getThreeQuotes()}`;
  }

  options = {
    name: "bot",
    id: 15,
    media: {
      description:
        "\n\nПоказывает интересную информацию о боте. Именно здесь находится ссылка для приглашения его на сервер.\n\n✏️\n```python\n!bot #без аргументов\n```\n\n",
    },
    alias: "бот stats статс ping пинг стата invite пригласить",
    allowDM: true,
    cooldown: 10_000,
    type: "bot",
  };
}

export default Command;
