import { BaseCommand } from "#lib/BaseCommand.js";

import { client } from "#bot/client.js";
import config from "#config";
import Template from "#lib/modules/Template.js";

import { Pager } from "#lib/DiscordPager.js";
import { escapeCodeBlock, escapeMarkdown, WebhookClient } from "discord.js";
import mol_global from "mol_tree2";

const DEFAULT_CODE_CONTENT = 'module("userData")';

function format_object(object) {
  const { $mol_tree2_from_json } = mol_global;

  return `\`\`\`tree\n${escapeCodeBlock(
    $mol_tree2_from_json(object).toString(),
  )}\`\`\``;
}
function resolve_page(raw) {
  if (typeof raw === "string") {
    raw = { description: raw };
  }
  const DISCORD_MESSAGE_LIMIT = 4096;
  raw.description = raw.description.slice(0, DISCORD_MESSAGE_LIMIT);
  return raw;
}
class Command extends BaseCommand {
  options = {
    name: "eval",
    id: 51,
    media: {
      description:
        "Хотя это и команда разработчика, вы можете просмотреть ваши данные из базы данных в JSON формате, для этого просто не вводите никаких аргументов. Список доступных модулей: !eval availableList",
      example: `!eval #без аргументов`,
    },
    accessibility: {
      publicized_on_level: 20,
    },
    alias: "dev евал эвал vm worker",
    allowDM: true,
    type: "other",
  };

  async loggerProtocol({ interaction }) {
    if (!process.env.EVAL_WEBHOOK_ID_AND_TOKEN) {
      return;
    }

    const [id, token] = process.env.EVAL_WEBHOOK_ID_AND_TOKEN.split(" ");
    const hook = new WebhookClient({ id, token });
    interaction.messageForLogging = await hook.msg({
      author: {
        name: `${interaction.user.username}, в #${interaction.channel.id}`,
        iconURL: client.user.avatarURL(),
      },
      description: `\`\`\`js\n${interaction.codeContent}\`\`\``,
      color: "#1f2022",
      footer: {
        iconURL: client.emojis.cache.get(interaction.emojiByType).imageURL(),
        text: "Вызвана команда !eval",
      },
    });
    return;
  }

  async onChatInput(msg, interaction) {
    const fetchReferense = async (reference) => {
      if (!reference) {
        return null;
      }
      const message = await msg.channel.messages.fetch(reference.messageId);

      if (!message) {
        return null;
      }

      return message.content;
    };

    const codeContent =
      (await fetchReferense(msg.reference)) ||
      interaction.params ||
      DEFAULT_CODE_CONTENT;

    Object.assign(interaction, {
      launchTimestamp: Date.now(),
      leadTime: null,
      emojiByType: null,
      pages: null,
      codeContent: codeContent.startsWith("```js")
        ? codeContent.match(/```js\n((?:.|\n)+?)```$/)[1]
        : codeContent,
    });

    const getOutput = async (interaction) => {
      try {
        const source = {
          executor: interaction.user,
          type: Template.sourceTypes.call,
        };
        return await new Template(source, interaction)
          .createVM()
          .run(interaction.codeContent);
      } catch (error) {
        config.development && console.error(error);
        return error;
      }
    };
    const output = await getOutput(interaction);
    interaction.leadTime = Date.now() - interaction.launchTimestamp;

    switch (true) {
      case output === undefined:
        interaction.pages = ["```{Пусто}```"];
        interaction.emojiByType = "753916360802959444";
        break;
      case output instanceof Error:
        interaction.pages = [`Ошибка (${output.name}):\n${output.message}`];
        interaction.emojiByType = "753916394135093289";
        break;
      case typeof output === "object":
        interaction.pages = [
          format_object(output),
          {
            title: "Карта полей. По-порядку начиная с третьей страницы",
            description: [
              "Основной объект",
              "*Вы здесь*",
              ...Object.keys(output),
            ]
              .map((title, i) => `${i + 1}. ${escapeMarkdown(title)}`)
              .join("\n"),
          },
          ...Object.entries(output).map(([title, value]) => ({
            title: `Поле \`${title}\``,
            description: format_object(value || {}),
          })),
        ];
        interaction.emojiByType = "753916315755872266";
        break;
      default:
        interaction.pages = [String(output)];
        interaction.emojiByType = "753916145177722941";
    }

    this.loggerProtocol({ interaction });

    const react = await msg.awaitReact(
      { user: msg.author, removeType: "one", time: 20000 },
      interaction.emojiByType,
    );
    if (!react) {
      return;
    }

    const pager = new Pager(interaction.channel);
    pager.setHideDisabledComponents(true);
    pager.setDefaultMessageState({
      title:
        "([**{**  <:emoji_48:753916414036803605> <:emoji_50:753916145177722941> <:emoji_47:753916394135093289> <:emoji_46:753916360802959444> <:emoji_44:753916315755872266> <:emoji_44:753916339051036736>  **}**])",
      author: { name: "Вывод консоли" },
      color: "#1f2022",
      footer: {
        text: `Время выполнения кода: ${interaction.leadTime}мс`,
      },
    });
    pager.addPages(...interaction.pages.map(resolve_page));
    pager.updateMessage();
  }
}

export default Command;
