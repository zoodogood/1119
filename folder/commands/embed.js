//@ts-check
import { BaseCommand } from "#lib/BaseCommand.js";
import * as Util from "#lib/util.js";
import { FormattingPatterns } from "discord-api-types/v10";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { MINUTE } from "#constants/globals/time.js";

class CommandRunContext extends BaseCommandRunContext {
  embed = {};
  addable = {
    reactions: null,
    webhook: null,
  };
  previewMessage = null;
  reactionsPool = null;
  user;
  channel;
  guild;

  updatePreviewMessage() {
    this.previewMessage.msg({ edit: true, ...this.embed });
  }

  static async new(interaction, command) {
    return new this(interaction, command);
  }

  constructor(interaction, command) {
    super(interaction, command);
    const { user, channel, guild } = interaction;
    Object.assign(this, { user, channel, guild });
    this.reactionsPool = this.command.DEFAULT_REACTIONS_POOL;
  }
}

class Command extends BaseCommand {
  createBaseEmbed(json) {
    const title = "Эмбед конструктор";
    const description = `С помощью реакций создайте великое сообщение, \nкоторое не останется незамеченным\nПосле чего отправьте его в любое место этого сервера!\n\n📌 - заглавие/название\n🎨 - цвет\n🎬 - описание\n👤 - автор\n🎏 - подгруппа\n🪤 - изображение сверху\n🪄 - изображение снизу\n🧱 - добавить область\n🕵️ - установить вебхук\n😆 - добавить реакции\n📥 - футер\n\n⭑ После завершения жмякайте <:arrowright:640449832799961088>\n`;

    const embed = {
      title,
      description,
    };

    if (json) {
      const parsed = JSON.parse(json);
      Object.assign(embed, parsed);
    }

    return embed;
  }

  DEFAULT_WEBHOOK_ICON_URL =
    "https://www.emojiall.com/images/240/openmoji/1f7e9.png";

  actions = [
    {
      emoji: "📌",
      async callback(context) {
        const { channel, user, embed } = context;
        embed.title = "{Введенный текст будет здесь}";
        await context.updatePreviewMessage();

        const question = await channel.msg({
          title: "Введите название 📌",
          color: embed.color,
        });
        let answer = (
          await channel.awaitMessage({
            user,
            remove: true,
          })
        )?.content;
        question.delete();
        if (!answer) {
          return;
        }

        const link = answer.match(/https:\/\/.+?(\s|$)/);
        if (link) {
          answer = answer.replace(link[0], "").trim();
          embed.url = link;
        }
        embed.title = answer;
      },
    },
    {
      emoji: "🎨",
      async callback(context) {
        const { channel, user, embed } = context;
        const HEX_PALLETTE_PICKER_URL = "https://g.co/kgs/nZmh1XP";
        const { content: answer } = await Util.question({
          channel,
          user,
          message: {
            title: "Цвет в формате: #2c2f33",
            description: `[Перейти к онлайн палитре](${HEX_PALLETTE_PICKER_URL})`,
            color: embed.color,
          },
        });
        if (!answer) {
          return;
        }

        const color = answer.match(/[a-f0-9]{6}/i)?.[0];
        if (!color) {
          channel.msg({
            title: "Неверный формат, ожидался цвет в формате HEX `#38f913`",
            color: "#ff0000",
            delete: 7_000,
          });
          return;
        }
        embed.color = color.toLowerCase();
      },
    },
    {
      emoji: "🎬",
      async callback(context) {
        const { channel, user, embed } = context;
        embed.description = "{Введенный текст будет здесь}";
        await context.updatePreviewMessage();
        const { content: answer } = await Util.question({
          channel,
          user,
          time: MINUTE * 15,
          message: {
            title: "Описание к фильму 🎬",
            color: embed.color,
          },
        });

        if (!answer) {
          return;
        }
        embed.description = answer;
      },
    },
    {
      emoji: "👤",
      async callback(context) {
        const { channel, user, embed } = context;
        embed.author = { name: "{Введенный текст будет здесь}" };
        await context.updatePreviewMessage();
        const { value: response } = await Util.question({
          channel,
          user,
          message: {
            title:
              "Упомяните пользователя, чтобы использовать его аватар и ник",
            description:
              "Или вы также можете указать произвольное имя пользователя и ссылку на изображение. Для этого не используйте никаких напоминаний",
            color: embed.color,
          },
        });

        if (!response) {
          return;
        }
        const member = response.mentions.users.first();
        const iconURL = member
          ? member.avatarURL()
          : (() => {
              const url = response.content.match(/https:\/\/.+?(\s|$)/)?.[0];
              response.content = response.content.replace(url, "").trim();
            })();
        const name = member ? member.username : response.content;
        embed.author = { name, iconURL };
      },
    },
    {
      emoji: "🎏",
      async callback(context) {
        await context.previewMessage.reactions.removeAll();
        context.reactionsPool = context.command.WHEN_UNCOVERED_REACTIONS_POOL;
      },
    },
    {
      emoji: "📥",
      async callback(context) {
        const { channel, user, embed } = context;
        embed.footer = { text: "{Введенный текст будет здесь}" };
        await context.updatePreviewMessage();
        const { value: response } = await Util.question({
          channel,
          user,
          message: {
            title: "Укажите текст футера",
            description: `А также впишите ссылку на изображение, если хотите, чтобы была картинка`,
            color: embed.color,
          },
        });

        if (!response) {
          return;
        }
        const iconURL = response.content.match(/https:\/\/.+?(\s|$)/)?.[0];
        if (iconURL) {
          response.content = response.content.replace(iconURL[0], "").trim();
        }

        embed.footer = { text: response, iconURL };
      },
    },
    {
      emoji: "😆",
      async callback(context) {
        const { channel, user, embed } = context;
        await context.previewMessage.reactions.removeAll();
        const collector = await channel.msg({
          title:
            'Установите реакции прямо под этим сообщением!\nА затем жмякните реакцию "Готово"<:mark:685057435161198594>',
          color: embed.color,
        });
        await context.previewMessage.awaitReact(
          { user, removeType: "one" },
          "685057435161198594",
        );
        const reactions = Array.from(collector.reactions.cache.keys());
        context.addable.reactions = reactions;

        collector.delete();
        await context.previewMessage.reactions.removeAll();
      },
    },
    {
      emoji: "🪤",
      async callback(context) {
        const { channel, user, embed } = context;
        const { content: answer } = await Util.question({
          channel,
          user,
          message: {
            title: "Ссылка на изображение",
            description: "Оно будет отображаться справа-сверху",
            color: embed.color,
          },
        });

        if (!answer.startsWith("http")) {
          channel.msg({
            title: "Вы должны указать ссылку на изображение",
            color: "#ff0000",
            delete: 7_000,
          });
          return;
        }
        embed.thumbnail = answer;
      },
    },
    {
      emoji: "🪄",
      async callback(context) {
        const { channel, user, embed } = context;
        const { content: answer } = await Util.question({
          channel,
          user,
          message: {
            title: "Ссылка на изображение",
            description: "Оно будет отображаться в нижней части эмбеда",
            color: embed.color,
          },
        });

        if (!answer.startsWith("http")) {
          channel.msg({
            title: "Вы должны указать ссылку на изображение",
            color: "#ff0000",
            delete: 7_000,
          });
          return;
        }
        embed.image = answer;
      },
    },
    {
      emoji: "🧱",
      async callback(context) {
        const { channel, user, embed } = context;

        const { content: name } = await Util.question({
          channel,
          user,
          message: {
            title: "Укажите имя для этой области",
            fields: [
              {
                name: "{Так отображается **название**}",
                value: "Тут будет значение",
              },
            ],
            color: embed.color,
          },
        });
        if (!name) {
          return;
        }
        const { content: value } = await Util.question({
          channel,
          user,
          message: {
            title: "Введите значение",
            fields: [{ name, value: "{Тут будет значение}" }],
            color: embed.color,
          },
        });

        if (!value) {
          return;
        }
        embed.fields ||= [];
        embed.fields.push({ name, value, inline: true });
      },
    },
    {
      emoji: "🕵️",
      async callback(context) {
        const { channel, user, embed } = context;
        const { value: response } = await Util.question({
          channel,
          user,
          message: {
            title:
              "Укажите имя и ссылку на аватар вебхука, от имени которого будет отправляться эмбед-сообщение.",
            description:
              "Если вы собираетесь использовать уже имеющийся вебхук, укажите только его имя.\nДля каждого канала, в который будет отправлено сообщение создаётся отдельный вебхук.",
            color: embed.color,
          },
        });

        if (!response) {
          return;
        }

        const avatar = Util.match(response.content, /http\S+/);
        if (avatar) {
          response.content = response.content.replace(avatar, "").trim();
        }

        context.addable.webhook = { name: response.content, iconURL: avatar };
        channel.msg({
          description:
            "Успешно установлен вебхук, от имени которого отправится эмбед",
          author: {
            name: response.content,
            iconURL: avatar || context.command.DEFAULT_WEBHOOK_ICON_URL,
          },
          delete: 9_000,
        });
      },
    },
    {
      emoji: "640449848050712587",
      async callback(context) {
        // Arror-Left
        await context.previewMessage.reactions.removeAll();
        context.reactionsPool = context.command.DEFAULT_REACTIONS_POOL;
      },
    },
    {
      emoji: "640449832799961088",
      async callback(context) {
        const { channel, user, embed, guild } = context;
        // Send Embed-Message
        await context.previewMessage.reactions.removeAll();

        const response = await Util.question({
          channel,
          user,
          message: {
            title: "Введите айди канала или упомяните его для отправки эмбеда",
            color: embed.color,
            description:
              "Или используйте реакцию <:arrowright:640449832799961088>, чтобы отправить в этот канал.",
            reactions: ["640449832799961088"],
          },
        });

        if (!response.value) {
          return;
        }

        const target =
          response.emoji === "640449832799961088"
            ? channel
            : guild.channels.cache.get(
                response.content.match(FormattingPatterns.Channel)?.groups.id,
              );

        if (!target) {
          channel.msg({
            title: "Канал не существует",
            color: "#ff0000",
            delete: 7500,
          });
          return;
        }

        if (
          target.guild.members
            .resolve(user)
            .wastedPermissions(18432n, target)[0]
        ) {
          target.msg({
            title:
              "В указанный канале у вас нет права отправлять эмбед-сообщения ",
            color: "#ff0000",
            delete: 7_500,
          });
          return;
        }

        context.command.sendEmbedMessageTo(target, context);
        context.reactionsPool = context.command.BEFORE_SEND_REACTIONS_POOL;
      },
    },
    {
      emoji: "❌",
      async callback(context) {
        await context.previewMessage.delete();
        context.end();
      },
    },
    {
      emoji: "✏️",
      async callback(context) {
        await context.previewMessage.reactions.removeAll();
        context.reactionsPool = context.command.DEFAULT_REACTIONS_POOL;
      },
    },
  ];

  async getOrInsertWebhookIn(channel, context) {
    const {
      user,
      addable: { webhook },
    } = context;
    const webhooks = await channel.fetchWebhooks();

    let hook = webhooks.find((compare) => compare.name === webhook.name);

    if (hook && webhook.avatar) {
      await webhook.edit({ avatar: webhook.avatar });
    }

    if (!hook) {
      const avatar = webhook.avatar || this.DEFAULT_WEBHOOK_ICON_URL;

      hook = await channel.createWebhook({
        name: webhook.name,
        avatar,
        reason: `${user.tag} (${user.id}) Created a message with Embed-constructor`,
      });
    }
    return hook;
  }

  async sendEmbedMessageTo(channel, context) {
    const {
      embed,
      addable: { webhook, reactions },
    } = context;
    const target = webhook
      ? await this.getOrInsertWebhookIn(channel, context)
      : channel;

    target.msg({ ...embed, reactions });
  }

  DEFAULT_REACTIONS_POOL = [
    "📌",
    "🎨",
    "🎬",
    "👤",
    "🎏",
    "📥",
    "😆",
    "640449832799961088",
  ];
  WHEN_UNCOVERED_REACTIONS_POOL = [
    "640449848050712587",
    "🧱",
    "🪄",
    "🪤",
    "🕵️",
  ];
  BEFORE_SEND_REACTIONS_POOL = ["✏️", "❌", "640449832799961088"];

  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    Object.assign(context.embed, this.createBaseEmbed(interaction.params));

    const { user, channel } = context;
    context.previewMessage = await channel.msg(context.embed);

    while (true) {
      if (context.isEnded) {
        return;
      }

      const react = await context.previewMessage.awaitReact(
        { user, removeType: "one" },
        ...context.reactionsPool,
      );

      const action = this.actions.find(({ emoji }) => emoji === react);
      if (!action) {
        context.channel.msg({
          description:
            "Процесс создания эмбеда был завершен по истечению времени",
          reference: context.previewMessage.id,
        });
        return;
      }

      await action.callback(context);
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
    cooldown: 10_000,
    cooldownTry: 3,
    type: "guild",
    ChannelPermissions: 16384n,
  };
}

export default Command;
