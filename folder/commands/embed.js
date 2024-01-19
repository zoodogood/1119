//@ts-check
import * as Util from "#lib/util.js";
import { client } from "#bot/client.js";
import { EmbedBuilder } from "discord.js";

class Command {
  async onChatInput(msg, interaction) {
    const context = {
      questionMessage: null,
      embed: new EmbedBuilder(),
      previewMessage: null,
      updatePreviewMessage: () => {
        context.previewMessage({ edit: true, ...context.embed });
      },
    };

    const createBaseEmbed = (json) => {
      const title = "Эмбед конструктор";
      const description = `С помощью реакций создайте великое сообщение \nкоторое не останется незамеченным\nПосле чего отправьте его в любое место этого сервера!\n\n📌 - заглавие/название\n🎨 - цвет\n🎬 - описание\n👤 - автор\n🎏 - подгруппа\n🪤 - изображение сверху\n🪄 - изображение снизу\n🧱 - добавить область\n🕵️ - установить вебхук\n😆 - добавить реакции\n📥 - футер\n\n⭑ После завершения жмякайте <:arrowright:640449832799961088>\n`;

      const embed = {
        title,
        description,
      };

      if (json) {
        try {
          const parsed = JSON.parse(json);
          Object.assign(embed, parsed);
        } catch {}
      }

      return embed;
    };

    Object.assign(context.embed, createBaseEmbed(interaction.params));

    const author = msg.author;

    context.previewMessage = await msg.msg(context.embed);

    let react, answer, reactions;

    while (true) {
      if (typeof react !== "object")
        react = await context.previewMessage.awaitReact(
          { user: author, removeType: "one" },
          "📌",
          "🎨",
          "🎬",
          "👤",
          "🎏",
          "📥",
          "😆",
          "640449832799961088",
        );
      else
        react = await context.previewMessage.awaitReact(
          { user: author, removeType: "one" },
          ...react,
        );

      switch (react) {
        case "📌":
          context.questionMessage = await msg.msg({
            title: "Введите название 📌",
            color: context.embed.color,
          });
          answer = await msg.channel.awaitMessage({
            user: msg.author,
            remove: true,
          });
          context.questionMessage.delete();
          if (!answer) {
            continue;
          }

          const link = answer.content.match(/https:\/\/.+?(\s|$)/);
          if (link) {
            answer.content = answer.content.replace(link[0], "").trim();
            context.embed.setURL(link);
          }
          context.embed.setTitle(answer);

          break;

        case "🎨":
          answer = await msg.channel.awaitMessage(msg.author, {
            title: "Цвет в формате: #2c2f33",
            embed: { color: embed.color },
          });
          if (!answer) {
            continue;
          }

          let color = answer.content.match(/[abcdef0-9]{6}|[abcdef0-9]{3}/i);
          if (!color) {
            msg.msg({
              title: "Неверный формат, введите цвет в формате HEX `#38f913`",
              color: "#ff0000",
              delete: 5000,
            });
            continue;
          }
          color = color[0].toLowerCase();
          color =
            color.length === 3 ? [...color].map((e) => e + e).join("") : color;

          context.embed.color = color;
          break;

        case "🎬":
          answer = await msg.channel.awaitMessage(msg.author, {
            time: 1000000,
            title: "Описание к фильму 🎬",
            embed: { color: embed.color },
          });
          if (!answer) {
            continue;
          }
          context.embed.setDescription(answer);
          break;

        case "👤":
          answer = await msg.channel.awaitMessage(msg.author, {
            title:
              "Упомяните пользователя, чтобы использовать его аватар и ник",
            embed: {
              description:
                "Вы также можете указать свое содержание. Для этого не используйте никаких упоминаний и укажите ссылку на изображение",
              color: embed.color,
            },
          });
          if (!answer) {
            continue;
          }
          const user = answer.mentions.users.first();
          if (user) {
            context.embed.setAuthor({
              name: user.username,
              iconURL: user.avatarURL(),
            });
            break;
          }

          let image = answer.content.match(/https:\/\/.+?(\s|$)/);
          if (image) {
            answer.content = answer.content.replace(image[0], "").trim();
          }

          image = image ? image[0] : null;
          context.embed.setAuthor({ name: answer.content, iconURL: image });
          break;

        case "🎏":
          await context.previewMessage.reactions.removeAll();
          react = ["640449848050712587", "🧱", "🪄", "🪤", "🕵️"];
          break;

        case "📥":
          answer = await msg.channel.awaitMessage(msg.author, {
            title: "Укажите текст футера",
            embed: {
              description: `Впишите ссылку на изображение, если хотите, чтобы была картинка`,
              color: embed.color,
            },
          });
          if (!answer) {
            continue;
          }
          let url = answer.content.match(/https:\/\/.+?(\s|$)/);
          if (url) {
            answer.content = answer.content.replace(url[0], "").trim();
          }

          url = url ? url[0] : null;
          context.embed.setFooter(answer, url);
          break;

        case "😆":
          await context.previewMessage.reactions.removeAll();
          const collector = await msg.msg({
            title:
              'Установите реакции прямо под этим сообщением!\nА затем жмякните реакцию"Готово"<:mark:685057435161198594>',
            color: embed.color,
          });
          react = await context.previewMessage.awaitReact(
            { user: author, removeType: "one" },
            "685057435161198594",
          );
          reactions = Array.from(collector.reactions.cache.keys());
          collector.delete();
          await context.previewMessage.reactions.removeAll();
          break;

        case "🪤":
          answer = await msg.channel.awaitMessage(msg.author, {
            title: "Ссылка на изображение",
            embed: {
              description: "Оно будет отображаться справа-сверху",
              color: embed.color,
            },
          });
          if (!answer) {
            continue;
          }
          if (!answer.content.startsWith("http")) {
            msg.msg({
              title: "Вы должны указать ссылку на изображение",
              color: "#ff0000",
              delete: 3000,
            });
            continue;
          }
          context.embed.setThumbnail(answer.content);
          react = ["640449848050712587", "🧱", "🪄", "🪤", "🕵️"];
          break;

        case "🪄":
          answer = await msg.channel.awaitMessage(msg.author, {
            title: "Ссылка на изображение",
            embed: {
              description: "Оно будет отображаться в нижней части эмбеда",
              color: embed.color,
            },
          });
          if (!answer) {
            continue;
          }
          if (!answer.content.startsWith("http")) {
            msg.msg({
              title: "Вы должны указать ссылку на изображение",
              color: "#ff0000",
              delete: 3000,
            });
            continue;
          }
          context.embed.setImage(answer.content);
          react = ["640449848050712587", "🧱", "🪄", "🪤", "🕵️"];
          break;

        case "🧱":
          const name = await msg.channel.awaitMessage(msg.author, {
            title: "Укажите имя для этой области",
            embed: {
              fields: [
                {
                  name: "Так отображается **название**",
                  value: "Тут будет значение",
                },
              ],
              color: embed.color,
            },
          });
          if (!name) {
            continue;
          }
          const value = await msg.channel.awaitMessage(msg.author, {
            title: "Введите значение",
            embed: {
              fields: [{ name: name, value: "Тут будет значение" }],
              color: embed.color,
            },
          });
          if (!value) {
            continue;
          }
          context.embed.addFields([{ name, value, inline: true }]);
          react = ["640449848050712587", "🧱", "🪄", "🪤", "🕵️"];
          break;

        case "🕵️":
          answer = await msg.channel.awaitMessage(msg.author, {
            title:
              "Укажите имя и ссылку на аватар Вебхука, от имени которого будет отправляться эмбед-сообщение.",
            embed: {
              description:
                "Если вы собираетесь использовать уже имеющийся вебхук, укажите только его имя.\nДля каждого канала, в который будет отправлено сообщение создаётся свой собственный вебхук.",
              color: embed.color,
            },
          });
          if (!answer) {
            continue;
          }

          const avatar = Util.match(answer, /http\S+/);
          if (avatar) {
            answer.content = answer.content.replace(avatar, "").trim();
          }

          context.embed.webhook = { name: answer.content, avatar };
          react = ["640449848050712587", "🧱", "🪄", "🪤", "🕵️"];
          msg.msg({
            title: "Успешно!",
            author: { name: answer.content, iconURL: avatar },
            delete: 3000,
          });
          break;

        case "640449848050712587":
          // Arror-Left
          await context.previewMessage.reactions.removeAll();
          break;

        case "640449832799961088":
          // Send Embed-Message
          await context.previewMessage.reactions.removeAll();
          const whatChannelSend = await msg.msg({
            title: "Введите Айди канала или упомяните его для отправки эмбеда",
            color: embed.color,
            description:
              "Или используйте реакцию <:arrowright:640449832799961088>, чтобы отправить в этот канал.",
          });
          answer = await Util.awaitReactOrMessage(
            whatChannelSend,
            msg.author,
            "640449832799961088",
          );
          whatChannelSend.delete();

          if (!answer) {
            continue;
          }

          let channel =
            answer === "640449832799961088"
              ? msg.channel
              : false ||
                answer.mentions.channels.first() ||
                msg.guild.channels.cache.get(answer.content) ||
                client.channels.cache.get(answer.content);

          if (!channel) {
            msg.channel.msg({
              title: "Канал не существует",
              color: "#ff0000",
              delete: 4500,
            });
            continue;
          }

          if (!channel.guild.members.resolve(msg.author)) {
            msg.channel.msg({
              title:
                "Вы должны присутствовать на сервере, которому предналежит этот канал, чтобы отправить Эмбед-сообщение",
              color: "#ff0000",
              delete: 4500,
            });
            continue;
          }

          if (
            channel.guild.members
              .resolve(msg.author)
              .wastedPermissions(18432, channel)[0]
          ) {
            msg.channel.msg({
              title:
                "В указанный канале у вас нет права отправлять Эмбед-сообщения ",
              color: "#ff0000",
              delete: 4500,
            });
            continue;
          }

          if (context.embed.webhook) {
            const webhooks = await channel.fetchWebhooks();
            let hook = webhooks.find(
              (e) => e.name === context.embed.webhook.name,
            );

            if (hook && context.embed.webhook.avatar) {
              await webhook.edit({ avatar: context.embed.webhook.avatar });
            }

            if (!hook) {
              hook = await channel.createWebhook(context.embed.webhook.name, {
                avatar:
                  context.embed.webhook.avatar ||
                  "https://www.emojiall.com/images/240/openmoji/1f7e9.png",
                reason: `${msg.author.tag} (${msg.author.id}) Created a message with Embed-constructor`,
              });
            }
            channel = hook;
          }

          await channel.msg({ content: context.embed, reactions: reactions });
          react = ["✏️", "❌", "640449832799961088"];
          break;

        case "❌":
          context.previewMessage.delete();
          return;

        case "✏️":
          context.previewMessage.reactions.removeAll();
          break;

        default:
          return;
      }

      context.updatePreviewMessage();
    }
  }

  options = {
    name: "embed",
    id: 9,
    media: {
      description:
        "\n\nСоздаёт эмбед конструктор — позволяет настроить красивое сообщение и отправить в канал на вашем сервере.\n\n❓ Кроме того, что это любимая команда разработчика, конструктор весьма прост и полезен. Используйте реакции, для настройки эмбеда\n\n✏️\n```python\n!embed <JSON>\n```\n\n",
    },
    alias: "ембед эмбед",
    allowDM: true,
    cooldown: 3_00_00,
    type: "guild",
    ChannelPermissions: 16384,
  };
}

export default Command;
