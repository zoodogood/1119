import app from "#app";
import { client } from "#bot/client.js";
import config from "#config";
import { BaseCommand, BaseFlagSubcommand } from "#lib/BaseCommand.js";
import {
  change_to_string,
  group_changes_by_default,
} from "#lib/ChangelogDaemon/api/display.js";
import { metadata } from "#lib/ChangelogDaemon/api/metadata.js";
import { BaseCommandRunContext } from "#lib/CommandRunContext.js";
import { Pager } from "#lib/DiscordPager.js";
import CommandsManager from "#lib/modules/CommandsManager.js";
import DataManager from "#lib/modules/DataManager.js";
import ErrorsHandler from "#lib/modules/ErrorsHandler.js";
import { ChangelogDaemon } from "#lib/modules/mod.js";
import {
  dayjs,
  ending,
  fetchFromInnerApi,
  getAddress,
  season_of_month,
  timestampToDate,
} from "#lib/util.js";

import { generateInviteFor } from "#lib/util.js";
import { CliParser } from "@zoodogood/utils/CliParser";
import { CreateModal } from "@zoodogood/utils/discordjs";
import { ButtonStyle, ComponentType, TextInputStyle } from "discord.js";

function website_get_useful_links() {
  const { origin } = config.server;
  return [
    {
      label: "Главная",
      href: `${origin}/pages/navigation`,
    },
    {
      label: "Страница ошибок",
      href: `${origin}/pages/errors/list`,
    },
    {
      label: "Список изменений",
      href: `${origin}/pages/modules/changelog/`,
    },
    {
      label: "Аудит ресурсов",
      href: `${origin}/pages/info/audit/resources`,
    },
  ];
}

class Invite_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--invite",
    capture: ["--invite"],
  };
  async onProcess() {
    const { context } = this;
    const link = generateInviteFor(client);
    const content = `[Пригласить: discord.com/oauth2/authorize?client_id=${client.user.id}](${link})`;
    context.interaction.msg({
      content,
    });
  }
}
class Node_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--node",
    capture: ["--node"],
  };
  async onProcess() {
    const { context } = this;
    const version = process.version;
    const content = `Node js: ${version} [${process.arch}]`;
    context.interaction.msg({
      content,
    });
  }
}
class Website_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--website",
    capture: ["--website"],
  };
  async onProcess() {
    const status = await fetchFromInnerApi("toys/ping", { parseType: "text" });
    const contents = {
      status: `Статус сервера: ${status}, — проверяет доступность домена.`,
      links: `Полезные сссылки:\n${website_get_useful_links()
        .map(({ label, href }) => `- [${label}](${href})`)
        .join("\n")}`,
    };
    const description = `${contents.status}\n\n${contents.links}`;

    this.context.interaction.msg({
      description,
    });
  }
}
class Errors_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--errors",
    capture: ["--errors"],
  };
  async onProcess() {
    const { context } = this;
    const entries = [...ErrorsHandler.session().errorGroups.entries()];

    if (!entries.length) {
      context.interaction.msg({
        content: "Сегодня тут пусто - нет ошибок текущего сеанса",
      });
      return;
    }

    const greeting = `Сообщение ошибки | [количество], время последнего появления`;

    const meta = [greeting];
    for (const [message, { errors }] of entries) {
      const format_meta = (errors) =>
        `[${errors.length}], <t:${Math.floor(errors.at(-1).createdAt / 1_000)}:R>`;
      meta.push(`- ${message} | ${format_meta(errors)}`);
    }
    context.interaction.msg({ content: meta.join("\n") });
  }
}

class Changelog_FlagSubcommand extends BaseFlagSubcommand {
  static FLAG_DATA = {
    name: "--changelog",
    capture: ["--changelog"],
  };
  getEmbed(groups, pager) {
    const { currentPage } = pager;
    const [period, bySymbol] = groups[currentPage];
    const description = bySymbol
      .map(
        ([group_base, changes]) =>
          `${group_base.label}:\n${changes.map(change_to_string).join("\n")}`,
      )
      .join("\n\n");

    return {
      title: `Список изменений за ${period}`,
      description,
    };
  }

  async onProcess() {
    const { context } = this;

    const groups = group_changes_by_default(ChangelogDaemon.data.map(metadata));
    const pager = new Pager();
    pager.setPagesLength(groups.length);
    pager.setChannel(context.interaction.channel);
    pager.setRender(() => this.getEmbed(groups, pager));
    pager.updateMessage();
  }
}

class CommandRunContext extends BaseCommandRunContext {
  parseCli(input) {
    const parsed = new CliParser()
      .setText(input)
      .captureFlags(this.command.options.cliParser.flags)
      .collect();

    const values = parsed.resolveValues((capture) => capture?.toString());
    this.setCliParsed(parsed, values);
    return parsed;
  }
}

class CommandDefaultBehaviour extends BaseFlagSubcommand {
  static commandsUsedContent() {
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
  static getMainInterfaceComponents() {
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

  onProcess() {
    const { interaction } = this.context;
    const { rss, heapTotal } = process.memoryUsage();
    const address = app.server && getAddress(app.server);

    const season = ["Зима", "Весна", "Лето", "Осень"][
      season_of_month(new Date().getMonth() + 1)
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
      components: CommandDefaultBehaviour.getMainInterfaceComponents(),
    };

    interaction.channel.msg(embed);
  }
}
class Command extends BaseCommand {
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

      const components = CommandDefaultBehaviour.getMainInterfaceComponents();
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
      const content = CommandDefaultBehaviour.commandsUsedContent();
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
  options = {
    name: "bot",
    id: 15,
    media: {
      description:
        "Показывает интересную информацию о боте. Именно здесь находится ссылка для приглашения его на сервер.",
      example: `!bot #без аргументов`,
    },
    cliParser: {
      flags: [
        Invite_FlagSubcommand.FLAG_DATA,
        Node_FlagSubcommand.FLAG_DATA,
        Website_FlagSubcommand.FLAG_DATA,
        Errors_FlagSubcommand.FLAG_DATA,
        Changelog_FlagSubcommand.FLAG_DATA,
      ],
    },
    accessibility: {
      publicized_on_level: 7,
    },
    alias: "бот stats статс ping пинг стата invite пригласить",
    allowDM: true,
    cooldown: 10_000,
    type: "bot",
  };

  async onChatInput(msg, interaction) {
    const context = await CommandRunContext.new(interaction, this);
    context.setWhenRunExecuted(this.run(context));
    return context;
  }
  async processChangelogSubcommand(context) {
    const value = context.cliParsed.at(1).get("--changelog");
    if (!value) {
      return false;
    }
    await new Changelog_FlagSubcommand(context, value).onProcess();
    return true;
  }
  async processErrorsSubcommand(context) {
    const value = context.cliParsed.at(1).get("--errors");
    if (!value) {
      return false;
    }
    await new Errors_FlagSubcommand(context, value).onProcess();
    return true;
  }
  async processInviteSubcommand(context) {
    const value = context.cliParsed.at(1).get("--invite");
    if (!value) {
      return false;
    }
    await new Invite_FlagSubcommand(context, value).onProcess();
    return true;
  }
  async processNodeSubcommand(context) {
    const value = context.cliParsed.at(1).get("--node");
    if (!value) {
      return false;
    }
    await new Node_FlagSubcommand(context, value).onProcess();
    return true;
  }
  async processWebsiteSubcommand(context) {
    const value = context.cliParsed.at(1).get("--website");
    if (!value) {
      return false;
    }
    await new Website_FlagSubcommand(context, value).onProcess();
    return true;
  }

  async run(context) {
    context.parseCli(context.interaction.params);
    if (await this.processInviteSubcommand(context)) {
      return;
    }
    if (await this.processNodeSubcommand(context)) {
      return;
    }
    if (await this.processWebsiteSubcommand(context)) {
      return;
    }
    if (await this.processErrorsSubcommand(context)) {
      return;
    }
    if (await this.processChangelogSubcommand(context)) {
      return;
    }
    await new CommandDefaultBehaviour(context).onProcess();
  }
}

export default Command;
